import time
import json
import os
import sys
import random
import shutil
import numpy as np
import pandas as pd
import h5py
from scipy import signal
import tensorflow as tf
from twilio.rest import Client
import matplotlib.pyplot as plt

# ==========================================
# CONSTANTS & CONFIGURATION
# ==========================================
MODEL_PATH = "aegis_final.tflite"
DATA_DIR = "data/"
SUB_COUNT = 64
TIME_STEPS = 500
EMERGENCY_THRESHOLD = 0.85
ANOMALY_THRESHOLD = 0.60
VISUALISATION_DIR = "visualisations/"
REPORT_DIR = "reports/"

# Twilio Settings (Mock credentials for now)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "mock_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
TWILIO_FROM_PHONE = os.getenv("TWILIO_FROM_PHONE", "+1234567890")
CAREGIVER_PHONE = os.getenv("CAREGIVER_PHONE", "+0987654321")

# Global State
is_offline = False

# ==========================================
# SIGNAL PROCESSING & VISUALIZATION
# ==========================================


def butterworth_filter(data, lowcut=0.5, highcut=10, fs=100, order=4):
    """Apply Butterworth bandpass filter to isolate human movement."""
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = signal.butter(order, [low, high], btype="band")
    return signal.filtfilt(b, a, data, axis=1)


def load_csi_sample(file_path):
    """Robust HDF5 loading with shape standardization."""
    full_path = os.path.join(DATA_DIR, file_path.lstrip("./"))
    try:
        with h5py.File(full_path, "r") as f:
            data = f["CSI_amps"][:]
            data = data.squeeze()
            if data.shape[0] >= SUB_COUNT:
                data = data[:SUB_COUNT, :]
            else:
                return None
            if data.shape[1] < TIME_STEPS:
                return None
            data = data[:, :TIME_STEPS]
            data = butterworth_filter(data)
            return data.T
    except Exception as e:
        print(f"Error loading {full_path}: {e}")
        return None


def visualize_waveform(sample_data, sample_id, actual_label, fall_confidence, baseline_data=None):
    """Generates a waveform anomaly chart comparing current CSI to a baseline."""
    plt.figure(figsize=(12, 6))

    # Calculate mean amplitude across all subcarriers for a clearer "waveform"
    current_waveform = np.mean(sample_data, axis=1)

    if baseline_data is not None:
        baseline_waveform = np.mean(baseline_data, axis=1)
        plt.plot(baseline_waveform, label="Normal Room Baseline (CSI)",
                 color="gray", alpha=0.5)

    color = "red" if fall_confidence >= ANOMALY_THRESHOLD else "green"
    plt.plot(current_waveform,
             label=f"Current CSI (Fall Conf: {fall_confidence:.2f})", color=color, linewidth=2)

    plt.title(
        f"Aegis Waveform Analysis: {sample_id}\nActual Label: {actual_label} | AI Confidence: {fall_confidence:.2f}")
    plt.xlabel("Time Steps (500 frames @ 100Hz)")
    plt.ylabel("Filtered CSI Amplitude (Mean of 64 Subcarriers)")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.7)

    # Ensure visualisation directory exists
    os.makedirs(VISUALISATION_DIR, exist_ok=True)
    save_path = os.path.join(VISUALISATION_DIR, f"{sample_id}.png")
    plt.savefig(save_path)
    plt.close()
    print(f"   => Waveform visualization saved to: {save_path}")

# ==========================================
# FALLBACK & ALERTING
# ==========================================


def send_sms_alert(message):
    print(f"[ALERT] Triggering Twilio SMS...")
    print(f"   => Message: {message}")
    if TWILIO_ACCOUNT_SID != "mock_sid":
        try:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message,
                from_=TWILIO_FROM_PHONE,
                to=CAREGIVER_PHONE
            )
            print(f"   => SMS Sent successfully. SID: {message.sid}")
        except Exception as e:
            print(f"   => Failed to send SMS: {e}")
    else:
        print("   => (Mock SMS Sent)")

# ==========================================
# MAIN EXECUTION
# ==========================================


def main():
    print("========================================")
    print("Aegis Wave: Edge Simulation")
    print("========================================")

    # 0. Purge old visualisations and prepare report directory
    if os.path.exists(VISUALISATION_DIR):
        print(f"Purging old visualisations from {VISUALISATION_DIR}...")
        shutil.rmtree(VISUALISATION_DIR)
    os.makedirs(VISUALISATION_DIR, exist_ok=True)
    os.makedirs(REPORT_DIR, exist_ok=True)

    # 1. Initialize TFLite model
    if not os.path.exists(MODEL_PATH):
        print(
            f"Error: Model not found at {MODEL_PATH}. Please run training.ipynb first.")
        sys.exit(1)

    print(f"Loading Quantized TFLite Model from {MODEL_PATH}...")
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # 2. Load dataset metadata and Scaler parameters
    metadata_path = os.path.join(DATA_DIR, "metadata/sample_metadata.csv")
    test_ids_path = os.path.join(DATA_DIR, "splits/test_id.json")
    scaler_path = "scaler_params.json"

    if not all(os.path.exists(p) for p in [metadata_path, test_ids_path, scaler_path]):
        print(
            f"Error: Missing required files: {[p for p in [metadata_path, test_ids_path, scaler_path] if not os.path.exists(p)]}")
        sys.exit(1)

    metadata_df = pd.read_csv(metadata_path)
    with open(test_ids_path, "r") as f:
        test_ids = json.load(f)

    # Randomize selection for robustness testing
    selected_ids = random.sample(test_ids, min(10, len(test_ids)))

    with open(scaler_path, "r") as f:
        scaler_params = json.load(f)
        scaler_mean = np.array(scaler_params["mean"])
        scaler_scale = np.array(scaler_params["scale"])
        print("Global scaler parameters loaded for robust inference.")

    # 3. Load a Baseline sample for visualization (find first Nonfall sample)
    baseline_data = None
    baseline_row = metadata_df[metadata_df["label"] == "Nonfall"]
    if not baseline_row.empty:
        baseline_file = baseline_row.iloc[0]["file_path"]
        baseline_data = load_csi_sample(baseline_file)
        if baseline_data is not None:
            # Standardize baseline for display using global scaler
            baseline_data_flat = baseline_data.reshape(-1)
            baseline_data = ((baseline_data_flat - scaler_mean) /
                             (scaler_scale + 1e-7)).reshape(baseline_data.shape)
            print(
                f"Baseline (Nonfall) sample loaded for visualization: {baseline_row.iloc[0]['id']}")

    print(f"Starting simulated live Wi-Fi CSI feed...\n")

    # Results tracking for report
    simulation_results = []

    # Process a batch of (10) random samples from the test set
    for count, sample_id in enumerate(selected_ids, start=1):
        row = metadata_df[metadata_df["id"] == sample_id]
        if row.empty:
            continue

        file_path = row.iloc[0]["file_path"]
        actual_label = row.iloc[0]["label"]
        device = row.iloc[0]["device"]

        print(f"--- Frame {count} | True Action: {actual_label} ---")

        # Simulate time passing between Wi-Fi CSI frames
        time.sleep(1.5)

        sample_data = load_csi_sample(file_path)
        if sample_data is None:
            print("Skipped malformed frame.\n")
            continue

        # Standardize sample using Global Scaler (crucial for model performance)
        sample_data_flat = sample_data.reshape(-1)
        processed_sample_flat = (
            sample_data_flat - scaler_mean) / (scaler_scale + 1e-7)
        processed_sample = processed_sample_flat.reshape(sample_data.shape)

        input_data = np.expand_dims(
            processed_sample, axis=0).astype(np.float32)

        # Run Edge Inference
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])

        # Output is [prob_fall, prob_nonfall] per LABEL_MAP = {"Fall": 0, "Nonfall": 1}
        fall_confidence = float(output_data[0][0])
        nonfall_confidence = float(output_data[0][1])
        predicted_label = "Fall" if fall_confidence >= EMERGENCY_THRESHOLD else "Nonfall"

        print(
            f"AI Inference -> Fall Probability: {fall_confidence:.4f} | Non-fall Probability: {nonfall_confidence:.4f}")

        # Track results
        simulation_results.append({
            "id": sample_id,
            "true": actual_label,
            "pred": predicted_label,
            "device": device,
            "conf": fall_confidence
        })

        # Visualize the waveform
        visualize_waveform(processed_sample, sample_id,
                           actual_label, fall_confidence, baseline_data)

        if fall_confidence >= EMERGENCY_THRESHOLD:
            print("🚨 HIGH CONFIDENCE: Fall Detected!")
            msg = f"Aegis Emergency Alert: Fall Detected. Confidence: {fall_confidence:.2f}. Action: Alert Caregiver."
            send_sms_alert(msg)

        elif fall_confidence >= ANOMALY_THRESHOLD:
            print(
                f"⚠️ ANOMALY DETECTED: Fall-like Event (Confidence {fall_confidence:.2f} < {EMERGENCY_THRESHOLD})")
            print("   => Action: Escalating safely without alarm fatigue.")
            print(
                "   => Triggering automated speaker broadcast: 'Hello, have you fallen? Please answer.'")
            msg = f"Aegis Anomaly Alert: Fall-like Event. Confidence: {fall_confidence:.2f}. Action: Speaker Check-in."
            send_sms_alert(msg)

        else:
            print("✅ Status: Normal. Background activities detected. No action required.")

        print(f"\n")

    # Generate Accuracy Report
    res_df = pd.DataFrame(simulation_results)
    accuracy = (res_df["true"] == res_df["pred"]).mean()
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    report_file = os.path.join(REPORT_DIR, f"report_{timestamp}.txt")

    with open(report_file, "w") as f:
        f.write("========================================\n")
        f.write(f"AEGIS SIMULATION REPORT - {timestamp}\n")
        f.write("========================================\n")
        f.write(f"Total Samples Processed: {len(res_df)}\n")
        f.write(f"Overall Accuracy: {accuracy:.4f}\n\n")

        f.write("--- PER LABEL ACCURACY ---\n")
        for label in ["Fall", "Nonfall"]:
            label_df = res_df[res_df["true"] == label]
            if not label_df.empty:
                acc = (label_df["true"] == label_df["pred"]).mean()
                f.write(f"  - {label}: {acc:.4f} ({len(label_df)} samples)\n")

        f.write("\n--- PER DEVICE ACCURACY ---\n")
        for dev in res_df["device"].unique():
            dev_df = res_df[res_df["device"] == dev]
            if not dev_df.empty:
                acc = (dev_df["true"] == dev_df["pred"]).mean()
                f.write(f"  - {dev}: {acc:.4f} ({len(dev_df)} samples)\n")

        f.write("\n--- SAMPLE DETAILS ---\n")
        f.write(res_df.to_string())

    print(f"Simulation report generated: {report_file}")

    print("========================================")
    print("Simulation completed.")


if __name__ == "__main__":
    main()
