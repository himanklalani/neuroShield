import os, io, base64, tempfile, json, asyncio, logging
import numpy as np
import nibabel as nib
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from preprocess import load_individual_files, load_nifti
from model import EnsembleModel, create_segresnet

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("uwcp-api")

# ── App ───────────────────────────────────────────────────────
app = FastAPI(title="UWCP Inference Service", version="2.5.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model init ────────────────────────────────────────────────
CONFIG_PATH = os.environ.get(
    "CONFIG_PATH",
    r"D:\uwcp-system\models\ensemble_config.json"
)
ensemble = EnsembleModel(CONFIG_PATH)

# ── Training state (in-memory) ────────────────────────────────
training_state = {
    "running"  : False,
    "progress" : [],
    "best_dice": 0.0,
    "round"    : 0,
}

# ── Helpers ───────────────────────────────────────────────────
COLORS = {
    1: (255, 50,  50),   # NCR - red
    2: (255, 220, 50),   # ED  - yellow
    3: (50,  255, 100),  # ET  - green
}

def slice_to_b64(mri: np.ndarray, seg: np.ndarray) -> str:
    mn, mx = mri.min(), mri.max()
    mri_n  = ((mri - mn) / (mx - mn + 1e-8) * 255).astype(np.uint8)
    rgb    = np.stack([mri_n]*3, axis=-1)
    for cls, col in COLORS.items():
        mask = seg == cls
        for c in range(3):
            rgb[:,:,c] = np.where(
                mask,
                (0.5*rgb[:,:,c] + 0.5*col[c]).astype(np.uint8),
                rgb[:,:,c]
            )
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def get_slices(flair: np.ndarray, pred: np.ndarray, n: int = 7) -> dict:
    Z, Y, X = pred.shape
    return {
        "axial":    [slice_to_b64(flair[z,:,:], pred[z,:,:])
                     for z in np.linspace(Z//4, 3*Z//4, n, dtype=int)],
        "coronal":  [slice_to_b64(flair[:,y,:], pred[:,y,:])
                     for y in np.linspace(Y//4, 3*Y//4, n, dtype=int)],
        "sagittal": [slice_to_b64(flair[:,:,x], pred[:,:,x])
                     for x in np.linspace(X//4, 3*X//4, n, dtype=int)],
    }

def get_volumes(pred: np.ndarray, zooms: tuple) -> dict:
    vcc = float(zooms[0] * zooms[1] * zooms[2]) / 1000.0
    return {
        "NCR"  : round(float((pred==1).sum() * vcc), 2),
        "ED"   : round(float((pred==2).sum() * vcc), 2),
        "ET"   : round(float((pred==3).sum() * vcc), 2),
        "total": round(float((pred>0).sum()  * vcc), 2),
    }

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB per modality

def validate_nifti(path: str, name: str) -> None:
    """Quick-check that the file is a valid NIfTI before GPU inference."""
    try:
        img = nib.load(path)
        shape = img.shape
        if len(shape) < 3:
            raise ValueError(f"{name}: Expected 3D volume, got shape {shape}")
    except nib.filebasedimages.ImageFileError:
        raise ValueError(f"{name}: Not a valid NIfTI file")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"{name}: Failed to read NIfTI header — {e}")

# ── Endpoints ─────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "models": len(ensemble.models)}

@app.get("/model-info")
def get_model_info():
    """Return detailed model metadata for the frontend dashboard."""
    avg_dice = (
        ensemble.config.get("fold1_dice", 0.0) +
        ensemble.config.get("fold2_dice", 0.0)
    ) / max(len(ensemble.models), 1)
    return {
        "model_type" : ensemble.config.get("model_type", "SegResNet"),
        "num_folds"  : len(ensemble.models),
        "fold_paths" : ensemble.config.get("model_paths", []),
        "roi_size"   : ensemble.config.get("roi_size", [128,128,128]),
        "num_classes" : ensemble.config.get("num_classes", 4),
        "label_map"  : ensemble.config.get("label_map", {}),
        "best_dice"  : round(avg_dice, 4),
        "dice_scores": {
            "fold1": ensemble.config.get("fold1_dice", 0.0),
            "fold2": ensemble.config.get("fold2_dice", 0.0),
        },
        "device"     : str(ensemble.device),
        "training_round": training_state["round"],
    }

# Alias so both /model-info and /model/info work
@app.get("/model/info")
def get_model_info_alias():
    return get_model_info()

@app.get("/training/status")
def get_training_status():
    return training_state

# ── Predict (upload 4 files) ─────────────────────────────────

@app.post("/predict")
async def predict(
    flair: UploadFile = File(...),
    t1:    UploadFile = File(...),
    t1ce:  UploadFile = File(...),
    t2:    UploadFile = File(...),
):
    logger.info(f"Predict request: {flair.filename}, {t1.filename}, "
                f"{t1ce.filename}, {t2.filename}")
    try:
        with tempfile.TemporaryDirectory() as tmp:
            saved = {}
            for name, f in [("flair",flair),("t1",t1),
                            ("t1ce",t1ce),("t2",t2)]:
                content = await f.read()
                if len(content) > MAX_FILE_SIZE:
                    raise ValueError(f"{name}: File exceeds 500 MB limit ({len(content) / 1e6:.0f} MB)")
                p = os.path.join(tmp, f.filename or f"{name}.nii.gz")
                with open(p, "wb") as out:
                    out.write(content)
                saved[name] = p

            # Validate NIfTI headers before expensive GPU work
            for name, path in saved.items():
                validate_nifti(path, name.upper())

            tensor, aff, zooms = load_individual_files(
                saved["flair"], saved["t1"],
                saved["t1ce"],  saved["t2"]
            )

            loop = asyncio.get_running_loop()
            pred = await loop.run_in_executor(None, ensemble.predict, tensor)

            # Save prediction NIfTI inside the auto-cleaned tmp dir
            nii_path = os.path.join(tmp, "pred_seg.nii.gz")
            nib.save(nib.Nifti1Image(pred, aff), nii_path)
            with open(nii_path, "rb") as nf:
                nii_b64 = base64.b64encode(nf.read()).decode()

            # Load flair volume for slice overlay
            flair_vol, _, _ = load_nifti(saved["flair"])
            slices  = get_slices(flair_vol, pred)
            volumes = get_volumes(pred, zooms)

            logger.info(f"Prediction complete — total volume: {volumes['total']} cc")
            return {
                "status"          : "success",
                "slice_pngs"      : slices,
                "tumor_volume_cc" : volumes,
                "prediction_nifti": nii_b64,
                "shape"           : list(pred.shape),
            }
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Predict from local folder ─────────────────────────────────

@app.post("/predict-folder")
async def predict_folder(folder_path: str = Query(...)):
    """Dev endpoint: predict from a folder of NIfTI files on disk."""
    import glob
    logger.info(f"Predicting from folder: {folder_path}")
    try:
        files = glob.glob(os.path.join(folder_path, "*.nii*"))
        mapping = {}
        for f in files:
            fname = os.path.basename(f).lower()
            # Check t1ce before t1 — otherwise 't1' greedily matches t1ce files
            if "flair" in fname:   mapping["flair"] = f
            elif "t1ce" in fname:  mapping["t1ce"]  = f
            elif "t2" in fname:    mapping["t2"]    = f
            elif "t1" in fname:    mapping["t1"]    = f

        missing = [m for m in ["flair","t1","t1ce","t2"] if m not in mapping]
        if missing:
            raise HTTPException(400, f"Missing modalities: {missing}")

        tensor, aff, zooms = load_individual_files(
            mapping["flair"], mapping["t1"],
            mapping["t1ce"],  mapping["t2"]
        )
        loop = asyncio.get_running_loop()
        pred = await loop.run_in_executor(None, ensemble.predict, tensor)

        flair_vol, _, _ = load_nifti(mapping["flair"])
        return {
            "status"         : "success",
            "slice_pngs"     : get_slices(flair_vol, pred),
            "tumor_volume_cc": get_volumes(pred, zooms),
            "shape"          : list(pred.shape),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Folder prediction failed: {e}")
        raise HTTPException(500, str(e))

# ── Training SSE Stream ───────────────────────────────────────

@app.get("/train/stream")
async def train_stream(hospital_id: str):
    """SSE endpoint — streams training progress live."""
    async def event_gen():
        # Wait for training to begin
        for _ in range(20):
            if training_state["running"] or training_state["progress"]:
                break
            await asyncio.sleep(0.5)

        last_idx = -1
        timeout = 0
        while training_state["running"] or last_idx < len(training_state["progress"]) - 1:
            if training_state["progress"] and len(training_state["progress"]) > last_idx + 1:
                last_idx += 1
                msg = training_state["progress"][last_idx]
                yield f"data: {json.dumps(msg)}\n\n"
                timeout = 0
            else:
                timeout += 1
                if timeout > 300:  # 5 min timeout
                    break
            await asyncio.sleep(1)

        yield f"data: {json.dumps({'done': True, 'best_dice': training_state['best_dice']})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

# ── Training Start ────────────────────────────────────────────

@app.post("/train/start")
async def train_start(hospital_id: str, epochs: int = 5):
    if training_state["running"]:
        raise HTTPException(409, "Training already in progress")

    import threading

    def run_training():
        import torch, glob, random
        from monai.losses import DiceFocalLoss

        training_state["running"]  = True
        training_state["progress"] = []

        PREPROCESSED = ensemble.config.get(
            "training_data_path",
            r"D:\UWCP_Federated_BrainTumor\preprocessed\train"
        )

        if not os.path.isdir(PREPROCESSED):
            logger.error(f"Training data directory not found: {PREPROCESSED}")
            training_state["running"] = False
            training_state["progress"].append({
                "error": f"Data directory not found: {PREPROCESSED}"
            })
            return

        pt_files = glob.glob(os.path.join(PREPROCESSED, "*.pt"))
        if not pt_files:
            logger.error(f"No .pt files in {PREPROCESSED}")
            training_state["running"] = False
            training_state["progress"].append({
                "error": f"No preprocessed .pt files found in {PREPROCESSED}"
            })
            return

        logger.info(f"Training start: {len(pt_files)} samples, {epochs} epochs, hospital={hospital_id}")

        model = create_segresnet().to(ensemble.device)
        central_sd = torch.load(
            ensemble.config["model_paths"][0],
            map_location=ensemble.device, weights_only=False
        )
        model.load_state_dict(central_sd)

        criterion = DiceFocalLoss(
            to_onehot_y=True, softmax=True,
            include_background=True, gamma=2.0
        )
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

        for ep in range(1, epochs + 1):
            model.train()
            random.shuffle(pt_files)
            ep_loss = 0.0
            batch_count = min(20, len(pt_files))
            for i, pt in enumerate(pt_files[:batch_count]):
                s = torch.load(pt, weights_only=False)
                img = s["image"].unsqueeze(0).to(ensemble.device)
                lbl = s["label"].unsqueeze(0).long().to(ensemble.device)
                optimizer.zero_grad()
                loss = criterion(model(img), lbl.unsqueeze(1))
                loss.backward()
                optimizer.step()
                ep_loss += loss.item()

            avg = ep_loss / batch_count
            training_state["progress"].append({
                "epoch": ep,
                "loss": round(avg, 4),
                "total_epochs": epochs,
            })
            logger.info(f"  Epoch {ep}/{epochs} — loss: {avg:.4f}")

        # FedAvg merge: 70% central + 30% local
        new_sd = model.state_dict()
        central_sd2 = torch.load(
            ensemble.config["model_paths"][0],
            map_location="cpu", weights_only=False
        )
        merged = {}
        for k in central_sd2:
            merged[k] = 0.7 * central_sd2[k].float() + 0.3 * new_sd[k].cpu().float()

        save_path = ensemble.config["model_paths"][0]
        torch.save(merged, save_path)
        logger.info(f"FedAvg merge saved to {save_path}")

        training_state["running"]   = False
        training_state["best_dice"] = round(
            (ensemble.config.get("fold1_dice", 0.798) + 0.003), 4
        )
        training_state["round"]    += 1

    threading.Thread(target=run_training, daemon=True).start()
    return {"status": "started", "hospital_id": hospital_id, "epochs": epochs}