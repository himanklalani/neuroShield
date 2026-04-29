import os, io, base64, tempfile, json, asyncio
import numpy as np
import nibabel as nib
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from preprocess import load_individual_files, load_nifti
from model import EnsembleModel, create_segresnet

app = FastAPI(title="UWCP Inference Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

CONFIG_PATH = os.environ.get(
    "CONFIG_PATH",
    r"D:\uwcp-system\models\ensemble_config.json"
)
ensemble = EnsembleModel(CONFIG_PATH)

# ── Training state (in-memory for local demo) ────────────────
training_state = {
    "running"  : False,
    "progress" : [],
    "best_dice": 0.0,
    "round"    : 0,
}

COLORS = {
    1: (255, 50,  50),
    2: (255, 220, 50),
    3: (50,  255, 100),
}

def slice_to_b64(mri, seg):
    mn, mx = mri.min(), mri.max()
    mri_n  = ((mri - mn) / (mx - mn + 1e-8) * 255).astype(np.uint8)
    rgb    = np.stack([mri_n]*3, axis=-1)
    for cls, col in COLORS.items():
        mask = seg == cls
        for c in range(3):
            rgb[:,:,c] = np.where(mask,
                (0.5*rgb[:,:,c] + 0.5*col[c]).astype(np.uint8),
                rgb[:,:,c])
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def get_slices(flair, pred, n=7):
    Z,Y,X = pred.shape
    return {
        "axial"   : [slice_to_b64(flair[z,:,:], pred[z,:,:])
                     for z in np.linspace(Z//4, 3*Z//4, n, dtype=int)],
        "coronal" : [slice_to_b64(flair[:,y,:], pred[:,y,:])
                     for y in np.linspace(Y//4, 3*Y//4, n, dtype=int)],
        "sagittal": [slice_to_b64(flair[:,:,x], pred[:,:,x])
                     for x in np.linspace(X//4, 3*X//4, n, dtype=int)],
    }

def get_volumes(pred, zooms):
    vcc = float(zooms[0]*zooms[1]*zooms[2])/1000.0
    return {
        "NCR"  : round(float((pred==1).sum()*vcc), 2),
        "ED"   : round(float((pred==2).sum()*vcc), 2),
        "ET"   : round(float((pred==3).sum()*vcc), 2),
        "total": round(float((pred>0).sum()*vcc),  2),
    }

@app.get("/health")
def health():
    return {"status":"ok","models":len(ensemble.models)}

@app.post("/predict")
async def predict(
    flair: UploadFile = File(...),
    t1:    UploadFile = File(...),
    t1ce:  UploadFile = File(...),
    t2:    UploadFile = File(...),
):
    try:
        with tempfile.TemporaryDirectory() as tmp:
            saved = {}
            for name, f in [("flair",flair),("t1",t1),
                            ("t1ce",t1ce),("t2",t2)]:
                p = os.path.join(tmp, f.filename or f"{name}.nii.gz")
                with open(p,"wb") as out:
                    out.write(await f.read())
                saved[name] = p

            tensor, aff, zooms = load_individual_files(
                saved["flair"], saved["t1"],
                saved["t1ce"],  saved["t2"])

            loop = asyncio.get_running_loop()
            pred = await loop.run_in_executor(None, ensemble.predict, tensor)

            nii_path = os.path.join(tmp, "pred.nii.gz")
            nib.save(nib.Nifti1Image(pred, aff), nii_path)
            with open(nii_path, "rb") as f:
                nii_b64 = base64.b64encode(f.read()).decode()

            # Load flair for slice visualization
            flair_vol, _, _ = load_nifti(saved["flair"])
            slices  = get_slices(flair_vol, pred)
            volumes = get_volumes(pred, zooms)

            return {
                "status"          : "success",
                "slice_pngs"      : slices,
                "tumor_volume_cc" : volumes,
                "prediction_nifti": nii_b64,
                "shape"           : list(pred.shape),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/train/stream")
async def train_stream(hospital_id: str):
    """SSE endpoint — streams training progress live"""
    async def event_gen():
        while training_state["running"]:
            if training_state["progress"]:
                msg = training_state["progress"][-1]
                yield f"data: {json.dumps(msg)}\n\n"
            await asyncio.sleep(1)
        yield f"data: {json.dumps({'done':True,'best_dice':training_state['best_dice']})}\n\n"

    return StreamingResponse(event_gen(),
                             media_type="text/event-stream")

@app.post("/train/start")
async def train_start(hospital_id: str, epochs: int = 5):
    if training_state["running"]:
        raise HTTPException(400, "Training already running")

    import threading
    def run_training():
        import torch, glob, random
        from monai.losses import DiceFocalLoss
        training_state["running"]  = True
        training_state["progress"] = []

        PREPROCESSED = r"D:\UWCP_Federated_BrainTumor\preprocessed\train"
        pt_files = glob.glob(os.path.join(PREPROCESSED,"*.pt"))
        if not pt_files:
            training_state["running"] = False
            return

        model     = create_segresnet().to(ensemble.device)
        central_sd= torch.load(
            ensemble.config["model_paths"][0],
            map_location=ensemble.device, weights_only=False)
        model.load_state_dict(central_sd)

        criterion = DiceFocalLoss(to_onehot_y=True, softmax=True,
                                  include_background=True, gamma=2.0)
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

        for ep in range(1, epochs+1):
            model.train()
            random.shuffle(pt_files)
            ep_loss = 0.0
            for i, pt in enumerate(pt_files[:20]):  # sample 20 per epoch
                s      = torch.load(pt, weights_only=False)
                img    = s["image"].unsqueeze(0).to(ensemble.device)
                lbl    = s["label"].unsqueeze(0).long().to(ensemble.device)
                optimizer.zero_grad()
                loss   = criterion(model(img), lbl.unsqueeze(1))
                loss.backward()
                optimizer.step()
                ep_loss += loss.item()

            avg = ep_loss / 20
            training_state["progress"].append({
                "epoch": ep, "loss": round(avg,4),
                "total_epochs": epochs
            })

        # FedAvg: 70% central + 30% hospital
        new_sd      = model.state_dict()
        central_sd2 = torch.load(
            ensemble.config["model_paths"][0],
            map_location="cpu", weights_only=False)
        merged = {}
        for k in central_sd2:
            merged[k] = 0.7*central_sd2[k].float() + \
                        0.3*new_sd[k].cpu().float()

        save_path = ensemble.config["model_paths"][0]
        torch.save(merged, save_path)
        training_state["running"]   = False
        training_state["best_dice"] = 0.0
        training_state["round"]    += 1

    threading.Thread(target=run_training, daemon=True).start()
    return {"status":"started","hospital_id":hospital_id}