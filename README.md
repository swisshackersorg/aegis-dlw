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

## Documentation

- **[spec-document.md](spec-document.md)** - Complete technical specification and hackathon implementation guide
- **[aegis_wave_poc.ipynb](aegis_wave_poc.ipynb)** - Basic proof-of-concept with simulated data
- **[aegis_wave_feasibility.ipynb](aegis_wave_feasibility.ipynb)** - Feasibility analysis based on FallDeFi paper with real dataset integration

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

Then open either:
- `aegis_wave_poc.ipynb` for basic demonstration
- `aegis_wave_feasibility.ipynb` for full feasibility analysis

## Quick Start

1. Follow setup instructions above
2. Open `aegis_wave_feasibility.ipynb`
3. Run all cells to see:
   - CSI data simulation
   - Model training (SVM + CNN)
   - TensorFlow Lite conversion
   - Real-time inference simulation
   - Confidence-based alert system

## Dataset

The project uses the FallDeFi dataset structure:
- 30 subcarriers from Intel 5300 NIC
- Activities: fall, walk, sit, liedown, bend, run
- ~100 packets per activity instance

For hackathon: Simulated data is included. Real dataset available at [FallDeFi GitHub](https://github.com/dmsp123/FallDeFi).

## Technology Stack

- **ML Framework**: TensorFlow/Keras + scikit-learn
- **Edge Deployment**: TensorFlow Lite (<50KB models)
- **Signal Processing**: SciPy (Butterworth filtering)
- **Visualization**: Matplotlib

## License

MIT License - Built for DLW Hackathon 2026