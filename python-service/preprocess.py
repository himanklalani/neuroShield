import numpy as np
import nibabel as nib
import torch
import glob
import os

def load_nifti(path):
    img = nib.load(path)
    return img.get_fdata(dtype=np.float32), img.affine, img.header

def zscore_normalize(vol, eps=1e-8):
    nonzero = vol[vol > 0]
    mean = nonzero.mean() if len(nonzero) > 0 else vol.mean()
    std  = nonzero.std()  if len(nonzero) > 0 else vol.std()
    return (vol - mean) / max(std, eps)

def load_individual_files(flair_path, t1_path, t1ce_path, t2_path):
    f_vol,  aff, hdr = load_nifti(flair_path)
    t1_vol, _,   _   = load_nifti(t1_path)
    tc_vol, _,   _   = load_nifti(t1ce_path)
    t2_vol, _,   _   = load_nifti(t2_path)

    f_vol  = zscore_normalize(f_vol)
    t1_vol = zscore_normalize(t1_vol)
    tc_vol = zscore_normalize(tc_vol)
    t2_vol = zscore_normalize(t2_vol)

    img4   = np.stack([f_vol, t1_vol, tc_vol, t2_vol], axis=0)
    tensor = torch.from_numpy(img4.astype(np.float32)).unsqueeze(0)
    zooms  = hdr.get_zooms()[:3]
    return tensor, aff, zooms