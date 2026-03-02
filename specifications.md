# Aegis: Fall Detection  WiFi CSI

**Tagline:** Zero-vision, zero-contact fall detection for the elderly using ambient Wi-Fi.

---

## 1. The MVP Technical Spec

For a 50-hour hackathon, do not try to configure physical Wi-Fi NICs to extract live CSI data—it is notoriously tricky. Instead, build the system architecture and simulate the edge node using pre-recorded public data.

* **The Data Source:** Utilise open-source datasets such as `csi_FallDetection`, `FallDeFi`, or other public datasets on Kaggle. These contain thousands of pre-processed Wi-Fi CSI matrices labeled with actions like "Fall," "Sit Down," "Walk," and "Pick Up."
* **The AI Model:** Train a lightweight 1D-CNN (Convolutional Neural Network) or GRU (Gated Recurrent Unit) on the dataset. Convert it to **TensorFlow Lite** to prove it can run on an edge device with low compute.
* **The (Simulated) Edge Node:** A Python script that reads the CSI dataset frame-by-frame (simulating a live Wi-Fi router feed), runs the local TFLite model, and publishes alerts via **MQTT**.
* **The Dispatch UI:** A lightweight web dashboard for the HDB block warden or emergency dispatcher.

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
* **The UI Action:** The dashboard shows: `ANOMALY DETECTED. Action: Fall-like Event. Confidence: 62% (Below 85% Emergency Threshold).` Instead of calling an ambulance, the system executes a safe fallback: it triggers an automated voice call to the resident's smart speaker: *"Auntie, did you drop something? Please say yes."*

### C. The "UI of Trust" (Explainability)
* **The Innovation:** Dispatchers need to know *why* the AI triggered an alert to trust it.
* **In the Video:** Zoom in on your Dispatch Dashboard. When a true fall is detected (Confidence 98%), the UI doesn't just flash a red alarm. It displays a "Waveform Anomaly Chart."
* **The UI Action:** Show a simple graph comparing the "Normal Empty Room Baseline CSI" vs the "Current Disturbed CSI."
* **Voiceover:** > *"Our UI doesn't just demand blind trust. It visually proves the anomaly to the dispatcher, showing the exact moment the Wi-Fi signal was fractured by a rapid human descent, allowing for immediate, confident dispatch."*

### D. Tangible Resilience (Graceful Degradation)
* **The Innovation:** Wi-Fi goes down. Power trips. A public safety system cannot rely on perfect cloud connectivity.
* **In the Video:** Do a live "pull the plug" demo. Show the edge node losing connection to the MQTT broker (simulate this by disabling your laptop's Wi-Fi).
* **The UI Action:** Trigger a fall in the simulation while offline. Show the terminal output caching the alert locally (`connection_lost: caching payload`). Then, show a Twilio API integration immediately firing an SMS text to a caregiver's phone.
* **Voiceover:** *"When the internet drops, Aegis doesn't die. It degrades gracefully, shifting from real-time dashboard updates to an offline cellular SMS fallback. The alert always gets through."*

### E. High Performance and Low Latency Processing?

---

## 3. Execution Timeline for your Team

* **Day 1:** Download datasets. Have your ML person start training the basic TensorFlow model immediately. Have the backend person set up the MQTT broker and Twilio SMS integration.
* **Day 2:** Write the Python script that feeds the dataset rows into your model sequentially to simulate a live feed. Build the frontend dashboard to subscribe to the MQTT alerts and display the "UI of Trust" graphs.
* **Day 3:** Refine the fallback logic (the "Negative Space" bag drop and the Wi-Fi disconnect). Spend the last 4 hours recording and editing the video.

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