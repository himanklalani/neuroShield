import torch
import numpy as np
import json
import os
from monai.networks.nets import SegResNet
from monai.inferers import sliding_window_inference

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[model.py] Device: {DEVICE}")

def create_segresnet():
    return SegResNet(
        spatial_dims=3,
        in_channels=4,
        out_channels=4,
        init_filters=32,
        blocks_down=(1,2,2,4),
        blocks_up=(1,1,1),
        dropout_prob=0.2,
    )

class EnsembleModel:
    def __init__(self, config_path: str):
        with open(config_path) as f:
            self.config = json.load(f)
        self.models   = []
        self.device   = DEVICE
        self.roi_size = tuple(self.config["roi_size"])

        print(f"[EnsembleModel] Loading {self.config['num_folds']} model(s)...")
        for path in self.config["model_paths"]:
            if not os.path.exists(path):
                print(f"  ERROR: Model file not found at {path}")
                continue
            m = create_segresnet().to(self.device)
            sd = torch.load(path, map_location=self.device, weights_only=False)
            m.load_state_dict(sd)
            m.eval()
            self.models.append(m)
            print(f"  Loaded: {os.path.basename(path)}")
        
        if not self.models:
            raise RuntimeError("No models could be loaded. Check your ensemble_config.json paths.")
        print(f"[EnsembleModel] Ready!")

    def predict(self, tensor):
        tensor = tensor.to(self.device)
        all_probs = []
        with torch.no_grad():
            for m in self.models:
                logits = sliding_window_inference(
                    tensor, self.roi_size,
                    sw_batch_size=1,
                    predictor=m, overlap=0.5,
                )
                all_probs.append(torch.softmax(logits, dim=1).cpu())
        avg   = torch.stack(all_probs).mean(0)
        pred  = torch.argmax(avg, dim=1).squeeze(0)
        return pred.numpy().astype(np.uint8)