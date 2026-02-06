import requests
from datetime import date
import shutil
import os

MOON_IMAGE_URL = (
    "https://svs.gsfc.nasa.gov/vis/a000000/a005500/"
    "a005587/frames/730x730_1x1_30p/moon.0868.jpg"
)

today = date.today().isoformat()
daily_filename = f"moon_{today}.jpg"

# Ensure images folder exists
os.makedirs("images", exist_ok=True)

daily_path = os.path.join("images", daily_filename)
latest_path = os.path.join("images", "latest.jpg")

print("Downloading Moon image...")
response = requests.get(MOON_IMAGE_URL)

if response.status_code == 200:
    with open(daily_path, "wb") as f:
        f.write(response.content)

    # Update latest.jpg
    shutil.copyfile(daily_path, latest_path)

    print("Saved:", daily_path)
    print("Updated:", latest_path)
else:
    raise Exception(f"Failed with status {response.status_code}")
