# Aegis: Fall Detection  WiFi CSI

**Tagline:** Zero-vision, zero-contact fall detection for the elderly using ambient Wi-Fi.

---

## 1. The MVP Technical Spec

For a 50-hour hackathon, do not try to configure physical Wi-Fi NICs to extract live CSI data—it is notoriously tricky. Instead, build the system architecture and simulate the edge node using pre-recorded public data.

* **The Data Source:** Utilise open-source datasets such as `csi_FallDetection`, `FallDeFi`, or other public datasets on Kaggle. These contain thousands of pre-processed Wi-Fi CSI matrices labeled with actions like "Fall," "Sit Down," "Walk," and "Pick Up."
* **The AI Model:** Train a lightweight 1D-CNN (Convolutional Neural Network) or GRU (Gated Recurrent Unit) on the dataset. Convert it to **TensorFlow Lite** to prove it can run on an edge device with low compute.
* **The (Simulated) Edge Node:** A Python script (`edge_simulation.py`) that reads the CSI dataset frame-by-frame (simulating a live Wi-Fi router feed), runs the local TFLite model, and triggers immediate alerts via **SMS**.
* **Explainability:** The system generates "Waveform Anomaly Charts" for every detection, allowing dispatchers to visually verify the anomaly.

---

## 2. The Video Pitch: Showcasing the Differentiators

Here is exactly how to weave the Responsible AI requirements into your 2-minute video demo to score maximum points.

### A. Zero-Trust Privacy by Default
* **The Innovation:** Hardware-level privacy. You cannot leak video/sound footage if there is no camera in the first place.
* **In the Video:** Start with a stark visual comparison. On the left, show a blurred CCTV camera feed of an elderly person. Put a red "X" over it. On the right, show a cascading matrix of numbers (the CSI subcarrier amplitudes).
* **Voiceover:** > *"Elderly residents refuse cameras in their HDB flats. Aegis uses standard Wi-Fi routers. We don't analyze pixels; we analyze how radio waves bounce off the water in the human body. It is physically impossible for our system to capture a face or a voice."*

### B. The "Negative Space" Demo (Failing Safely)
* **The Innovation:** Avoiding alarm fatigue. If the AI is unsure, it escalates gracefully instead of triggering a full emergency response.
* **In the Video:** Show a simulation of someone dropping a heavy bag of rice. The AI model processes the CSI wave disturbance.
* **The terminal Action:** The simulation shows: `ANOMALY DETECTED. Action: Fall-like Event. Confidence: 62% (Below 85% Emergency Threshold).` Instead of calling an ambulance, the system executes a safe fallback: it triggers an automated voice call to the resident's smart speaker: *"Auntie, did you drop something? Please say yes."*

### C. The "UI of Trust" (Explainability)
* **The Innovation:** Dispatchers need to know *why* the AI triggered an alert to trust it.
* **In the Video:** Zoom in on your simulation output and generated graphs. When a true fall is detected (Confidence 98%), the system doesn't just print an alert. It saves a "Waveform Anomaly Chart."
* **The UI Action:** Show a simple graph comparing the "Normal Empty Room Baseline CSI" vs the "Current Disturbed CSI."
* **Voiceover:** > *"Our system doesn't just demand blind trust. It visually proves the anomaly, showing the exact moment the Wi-Fi signal was fractured by a rapid human descent, allowing for immediate, confident verification."*

### D. Tangible Resilience (Graceful Degradation)
* **The Innovation:** A public safety system must be resilient to network fluctuations.
* **In the Video:** Show the edge node's ability to trigger immediate SMS alerts directly from the edge.
* **The UI Action:** Trigger a fall in the simulation. Show the terminal output firing a Twilio API integration, immediately sending an SMS text to a caregiver's phone.
* **Voiceover:** *"Aegis is built for resilience. Alerts don't just sit in a dashboard; they are fired as immediate SMS notifications to caregivers, ensuring the alert always gets through even if primary internet services are fluctuating."*

---

## 3. Future Extensions

* **MQTT Integration:** Implementing a pub/sub architecture using MQTT for real-time dashboard updates and centralized management of multiple edge nodes.
* **The Dispatch UI:** A lightweight web dashboard for the HDB block warden or emergency dispatcher to subscribe to MQTT alerts and view real-time CSI streams.
* **Physical Hardware:** Moving beyond simulation to extract real-time CSI data from physical Wi-Fi NICs.

---

## 4. Development & Implementation Notebooks

The model implementation is divided strictly into singular-purpose notebooks according to their filenames, ensuring modularity and clean execution:

* **`training.ipynb` (Model Pipeline & Edge Export):** The core machine learning pipeline. It handles the standardization of disparate CSI inputs (e.g., matching 232-subcarrier to 64-subcarrier shapes), trains the lightweight 1D-CNN model with early stopping/validation, and directly exports the quantized `aegis_wave_final.tflite` optimized for constrained edge devices.

## 5. Hardware Compatibility & Stability (Apple Silicon)

On Apple Silicon (M-series) Macs, the transition from **GPU-accelerated training** (`tensorflow-metal`) to **CPU-based graph conversion** (`TFLiteConverter`) is a known stability bottleneck.

- **Stable Versioning:** We pinned the environment to **TensorFlow 2.15.0** and **Keras 2.15.0**. This avoids the Keras 3.x memory-sync bug that often leads to hard kernel crashes during TFLite optimization.
- **Python Versioning:** Using **Python 3.10** ensures compatibility with stable `pandas` and `scipy` builds for macOS without requiring unstable source-level compilation.
- **GPU Management:** To prevent kernel crashes, we explicitly enable `experimental.set_memory_growth` and use `TF_USE_LEGACY_KERAS=1` to ensure the model graph is cleanly handled by the legacy TFLite converter.

---
*This project hits every single note the DLW track is looking for: edge computing, extreme privacy, empathy for a vulnerable community, and deep technical execution.*
