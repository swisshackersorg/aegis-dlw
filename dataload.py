import os
from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()

dataset = "guozhenjennzhu/csi-bench"
# We only want files inside FallDetection that are labeled as 'act_Fall'
target_subfolder = "csi-bench-dataset/csi-bench-dataset/FallDetection"

print("Fetching file list...")
files = api.dataset_list_files(dataset).files

for file in files:
    # Filter: Must be in FallDetection AND must be an actual fall action
    if target_subfolder in file.name and "act_Fall" in file.name:
        print(f"Downloading: {file.name}")
        api.dataset_download_file(dataset, file.name, path='./fall_data')