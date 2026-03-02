# Aegis Wave - Zero-Vision Fall Detection

**Tagline:** Zero-vision, zero-contact fall detection for the elderly using ambient Wi-Fi.

## Project Overview

Aegis Wave uses Wi-Fi CSI (Channel State Information) to detect falls without cameras, preserving privacy while providing reliable emergency detection for elderly residents in HDB flats.

### Key Features
- 🔒 **Zero-Trust Privacy**: No cameras, no visual data
- 🎯 **95%+ Accuracy**: Based on peer-reviewed FallDeFi research
- ⚡ **Edge Computing**: Runs on low-cost hardware (Raspberry Pi)
- 🛡️ **Graceful Degradation**: Confidence-based alerts prevent false alarms
- 📊 **Explainable AI**: Visual CSI waveforms for dispatcher trust

## Documentation & Notebooks

This project is separated into singular-purpose Jupyter Notebooks to cleanly reflect each stage of the development and testing process:

- **[specifications.md](specifications.md)** - Complete technical specification and implementation guide.
- **[training.ipynb](training.ipynb)** - The primary training and validation pipeline. Its singular purpose is to handle robust data processing (standardizing 232-subcarrier and 64-subcarrier inputs), train the 1D-CNN fall detection model, evaluate its performance, and export the optimized, quantized TensorFlow Lite model (`aegis_wave_final.tflite`) for deployment on heterogeneous edge devices.

## Setup Instructions

### 1. Create Virtual Environment
We recommend using **Conda** for Apple Silicon (M-series) to ensure stable library linkage.

```bash
conda create -n aegis-mac python=3.10
conda activate aegis-mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### Apple Silicon (M-series) Stability
On Mac M-series GPUs, the transition from training to TFLite conversion can cause **Kernel Crashes** due to memory-sync issues between `tensorflow-metal` and Keras 3.

To prevent this:
1. We use the **"Golden Stable"** version set: `tensorflow-macos==2.15.0` + `keras==2.15.0`.
2. Always include this environment flag at the **very start** of your notebook:
   ```python
   import os
   os.environ['TF_USE_LEGACY_KERAS'] = '1'
   ```

### 3. Run Jupyter Notebooks
```bash
jupyter notebook
```

Then open the notebook corresponding to your current task (i.e., `training.ipynb` for full model training and export) and run accordingly.

## Dataset

The project relies on Wi-Fi CSI subcarrier data. The actual dataset structure features:
- Activities: fall, walk, sit, liedown, bend, run

Real data sets are processed in `smoke_test.ipynb` for data sanitization checks and `training.ipynb` for final model generation.

## Technology Stack

- **ML Framework**: TensorFlow/Keras + scikit-learn
- **Edge Deployment**: TensorFlow Lite (<100KB models)
- **Signal Processing**: SciPy (Butterworth filtering)
- **Visualization**: Matplotlib

## License

MIT License - Built for DLWeek 2026
