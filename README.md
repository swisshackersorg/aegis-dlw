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

- **[specifications.md](specifications.md)** - Complete technical specification and hackathon implementation guide.
- **[smoke_test.ipynb](smoke_test.ipynb)** - An ultra-robust diagnostic and data integrity test. Its singular purpose is to ensure the real HDF5 dataset can be successfully parsed, sanitized of NaN/Inf values, and that both Dense and 1D-CNN model architectures compile and execute correctly on the hardware without memory or compilation errors.
- **[training.ipynb](training.ipynb)** - The primary training and validation pipeline. Its singular purpose is to handle robust data processing (standardizing 232-subcarrier and 64-subcarrier inputs), train the 1D-CNN fall detection model, evaluate its performance, and export the optimized, quantized TensorFlow Lite model (`aegis_wave_final.tflite`) for deployment on heterogeneous edge devices.

## Setup Instructions

### 1. Create Virtual Environment
```bash
py -3.12 -m venv venv
```

### 2. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Jupyter Notebooks
```bash
jupyter notebook
```

Then open the notebook corresponding to your current task (e.g., `smoke_test.ipynb` to verify data loading and compilation, or `training.ipynb` for full model training and export).

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

MIT License - Built for DLW Hackathon 2026
