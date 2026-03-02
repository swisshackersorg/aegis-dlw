# Aegis: Technical Specification & Implementation Guide

**Project Tagline:** Zero-vision, zero-contact fall detection for the elderly using ambient Wi-Fi.

---

## 1. The Core Architecture: "Signal to Alert"

The Aegis system is designed to operate entirely at the edge, ensuring absolute privacy and low-latency response. It transforms standard Wi-Fi router signals (CSI) into immediate life-saving alerts.

### A. The Data Source (Wi-Fi CSI)
Instead of relying on vision (cameras) or sound (microphones), Aegis analyzes **Channel State Information (CSI)**. CSI measures how Wi-Fi subcarriers are attenuated and phased as they bounce off objects—specifically the water-dense human body. 
- **Privacy:** It is physically impossible to reconstruct a face or a voice from CSI data.
- **Ubiquity:** Every modern Wi-Fi router generates this data.

### B. Signal Processing Pipeline
Every frame of CSI data undergoes a 3-step preparation phase:
1. **Butterworth Bandpass Filter:** We apply a 0.5Hz to 10Hz filter to eliminate background "noise" (like fan blades) and isolate the specific frequency range of human movements (walking, sitting, falling).
2. **Standardization:** Raw CSI amplitudes vary across devices (HP vs. ESP32). We use **Global Scaling Parameters** (mean/std) derived from the entire training set to ensure the model sees a consistent input distribution.
3. **Temporal Slicing:** The data is windowed into 64 subcarriers × 500 time steps, representing a 5-second window of activity.

### C. The Edge AI Engine (TensorFlow Lite)
To prove deployment viability on resource-constrained hardware (Raspberry Pi, ESP32, edge routers), we use a quantized **1D-CNN**.
- **Model Size:** ~27KB.
- **Inference Speed:** <5ms on a standard CPU.
- **Logic:** The model performs binary classification between "Fall" (Index 0) and "Nonfall" (Index 1).

---

## 2. Responsible AI: The "UI of Trust"

In emergency dispatch, blind trust in AI is dangerous. Aegis solves this through two critical design patterns:

### A. Explainability via Waveform Anomaly Charts
Whenever an alert is triggered, the system generates a **Waveform Anomaly Chart**. This graph plots the current disturbed Wi-Fi signal against a "Normal Room Baseline." 
- **Judge/Dispatcher Value:** The dispatcher can visually verify the "fractured" wave caused by a rapid human descent before dispatching resources.

### B. Intelligent Escalation (Graceful Degradation)
To avoid "alarm fatigue" (the boy who cried wolf), Aegis uses confidence-based thresholds:
- **EMERGENCY (Conf > 85%):** A high-confidence fall. Immediate dispatch of emergency services.
- **ANOMALY (60% < Conf < 85%):** A "fall-like" disturbance. Instead of an ambulance, it triggers a smart speaker check-in: *"Auntie, did you drop something? Please say yes."*
- **SMS Integration:** All high-priority events fire a Twilio SMS to caregivers, ensuring alerts reach humans even if primary dashboard services fail.

---

## 3. Implementation Workflow

### training.ipynb: The Model Pipeline
- **Modular Data Loading:** Robustly handles disparate HDF5 shapes.
- **Training Strategy:** Implements **EarlyStopping** and **ModelCheckpointing** to find the absolute best version of the model.
- **Scaler Export:** Saves the global standardization parameters to `scaler_params.json`, a critical step for cross-platform inference accuracy.

### edge_simulation.py: The Simulator
This script mimics a live edge node deployment:
- **Randomization:** Picks unique test samples for every run to prove robustness.
- **Real-time Feedback:** Prints inference probabilities and escalation actions to the terminal.
- **Validation Logs:** Automatically generates a `reports/` text file with accuracy metrics (Overall, Per-Label, Per-Device).

---

## 4. Hardware Stability & Compatibility
The project is built on **Python 3.10** with pinned versions for TensorFlow and Keras to ensure stability across Windows, Linux, and macOS. 
- **Legacy Compatibility:** We use `TF_USE_LEGACY_KERAS=1` to ensure the TFLite converter correctly handles the 1D-CNN graph, avoiding common kernel crashes on modern architectures.

---

## 5. Future Roadmap
- **MQTT Integration:** Moving from local simulation to a distributed pub/sub architecture.
- **Dispatch UI:** A centralized web dashboard for block wardens to monitor multiple units.
- **Cross-Frequency Analysis:** Incorporating 5GHz and 6GHz bands for even higher precision.

---
*Aegis hits every core mandate of the DLW track: edge computing, extreme privacy, and deep technical execution with empathy for the vulnerable.*
