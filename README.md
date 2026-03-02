# Aegis: Zero-Vision Fall Detection for Elderly Care

A privacy-first, zero-contact fall detection model using ambient Wi-Fi CSI.

## 🛡️ Private by Design
Elderly residents often refuse cameras in their homes due to privacy concerns. **Aegis** solves this by using standard Wi-Fi signals (Channel State Information - CSI) to detect human movement. 

By analyzing how radio waves bounce off the human body, Aegis can identify a fall with high accuracy without ever capturing a face or a voice. It is **physically impossible** for this system to leak visual or audio data.

## ✨ Key Features
- 🔒 **Zero-Trust Privacy**: Hardware-level privacy using radio waves instead of pixels.
- 🧠 **Edge-First AI**: Lightweight 1D-CNN model (~27KB) optimized for edge routers and IoT devices.
- 📉 **UI of Trust**: Automated waveform anomaly charting that visually proves *why* the AI triggered an alert.
- 🚨 **Intelligent Escalation**: Multi-threshold logic (Emergency vs. Anomaly) to prevent "alarm fatigue" from false positives.
- 📱 **Omni-Channel Alerting**: SMS integration via Twilio for immediate caregiver notification.
- 📊 **Automated Reporting (Demo)**: Generates detailed accuracy and performance reports after every simulation run.

## 🚀 Quickstart

This project is designed to be fully reproducible on any modern OS (Windows, macOS, Linux).

### 1. Environment Setup
We recommend using **Python 3.10**.

1. Clone the repository and navigate to the project root.
2. Create a virtual environment:
   ```bash
   python -m venv aegis
   ```
3. Activate the virtual environment:
   ```bash
   # In Windows
   aegis\Scripts\activate
   ```
   ```bash
   # On macOs/Linux
   source aegis/bin/activate
   ```
4. Install Dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 2. Model Training (Optional)
The project comes with a pre-trained model (`aegis_final.tflite`) and scaling parameters (`scaler_params.json`). If you wish to retrain:
1. Ensure the `data/` directory is populated with the CSI dataset.
2. Launch Jupyter: `jupyter notebook` (or select a kernel in your IDE).
3. Open **`training.ipynb`**.
4. Run all cells. This will:
   - Standardize disparate Wi-Fi signals (HP vs. ESP32).
   - Train the 1D-CNN with **EarlyStopping** and **ModelCheckpointing** to maximize accuracy.
   - Export the best version of the model and the global scaling parameters.

### 3. Run the Edge Simulation (Demo)
The `edge_simulation.py` script simulates a live Wi-Fi router feed by pulling random samples from the test set.

**To run the simulation:**
```bash
python edge_simulation.py
```

**What happens:**
1. **Purge**: Clean up old visualisations.
2. **Randomized Feed**: Select 10 random samples from the test set to prove model robustness.
3. **Inference**: Process each frame through the Butterworth filter and then the TFLite model.
4. **Visualize**: Saves PNG waveform graph for every frame in `visualisations/`.
5. **Alert**: Trigger mock SMS alerts for detected falls or anomalies.
6. **Report**: Generates a timestamped accuracy report in `reports/`.

## 🛠️ Technical Implementation

### The Pipeline
1. **Signal Processing**: Raw CSI is passed through a **Butterworth Bandpass Filter** (0.5Hz–10Hz) to isolate human movement frequencies.
2. **Standardization**: Data is scaled using **Global Scaling Parameters** derived from the entire training set to ensure cross-device accuracy.
3. **Inference**: A quantized **TensorFlow Lite 1D-CNN** performs binary classification (Fall vs. Nonfall).
4. **Decision Engine**:
   - `Conf > 85%`: **Emergency Fall** (Dispatch Ambulance + SMS).
   - `60% < Conf < 85%`: **Anomaly** (Smart Speaker Check-in + SMS).
   - `Conf < 60%`: **Normal Activity**.

## 📂 Project Structure
```
aegis-dlw/
├── aegis_final.tflite
├── best_aegis_model.h5
├── edge_simulation.py
├── scaler_params.json
├── training.ipynb
├── README.md
├── requirements.txt
├── data/
├── reports/
├── visualisations/
```

- `edge_simulation.py`: The primary simulation engine and demo script.
- `training.ipynb`: The ML pipeline (Data -> Training -> TFLite Export).
- `scaler_params.json`: Global mean/std for consistent inference.
- `data/`: (Simulated) HDF5 Wi-Fi CSI dataset and metadata.
- `reports/`: Automated performance evaluation logs.
- `visualisations/`: Generated Waveform Anomaly Charts.

## 📜 Miscellaneous
Developed for DLWeek 2026 by Swisshackers.
