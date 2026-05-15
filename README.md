# UWCP Brain Tumor Segmentation System

A professional, federated medical AI system for brain tumor segmentation using MONAI (SegResNet) and Next.js.

## System Architecture

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Recharts.
- **Backend**: FastAPI (Python 3.13), MONAI, PyTorch, Nibabel.
- **Protocol**: Federated Learning (FedAvg) for privacy-preserving model updates.

## Prerequisites

- Python 3.10+ (Recommended 3.13)
- Node.js 18+
- CUDA-enabled GPU (RTX 3060+ recommended)

## Installation & Setup

### 1. Python Service Setup

```bash
cd python-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the System

### Start Python Service (Port 8000)

```bash
cd python-service
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Start Next.js Frontend (Port 3000)

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the system.

## Features

- **Advanced Segmentation**: Ensemble of SegResNet models for high-accuracy brain tumor detection.
- **Input Validation**: NIfTI header verification and file-size guards (500 MB) before GPU inference.
- **Federated Training**: Securely contribute local hospital data updates to the global model.
- **Premium UI/UX**: Medical-grade glassmorphism interface with dark mode and smooth animations.
- **Patient Tracking**: Local inference history and patient-tagged exports (NIfTI + text report).
- **Interactive Viewer**: Multi-planar (Axial, Coronal, Sagittal) visualization with overlay, zoom, brightness/contrast controls.

## Design System

- **Colors**: Midnight Navy (#070d1a), Electric Cyan (#00d4ff), Slate/Purple accents.
- **Typography**: DM Sans (Body), Space Mono (Metrics).

## Project Structure

```
uwcp-system/
├── python-service/          # FastAPI backend
│   ├── main.py              # API endpoints + inference logic
│   ├── model.py             # EnsembleModel class (loads .pth weights)
│   ├── preprocess.py        # NIfTI loading + z-score normalization
│   └── requirements.txt     # Python dependencies
├── frontend/                # Next.js 16 app
│   ├── app/                 # App Router pages + layout
│   └── components/          # React components
│       ├── Login.tsx         # Hospital authentication
│       ├── Dashboard.tsx     # Tab navigation + model status bar
│       ├── Inference.tsx     # MRI upload + prediction workflow
│       ├── BrainViewer.tsx   # Multi-planar slice viewer
│       ├── Training.tsx      # Federated training interface
│       ├── Toast.tsx         # Notification system
│       └── InferenceHistory.tsx  # Local case history
├── models/                  # Model configuration
│   └── ensemble_config.json # Paths + hyperparameters
├── fold1_best.pth           # Pre-trained SegResNet (fold 1)
└── fold2_best.pth           # Pre-trained SegResNet (fold 2)
```

---
© 2026 UWCP Medical AI Team
