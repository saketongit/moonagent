import requests
from datetime import date

MOON_IMAGE_URL = (
    "https://svs.gsfc.nasa.gov/vis/a000000/a005500/"
    "a005587/frames/730x730_1x1_30p/moon.0868.jpg"
)

today = date.today().isoformat()
filename = f"moon_{today}.jpg"

print("Downloading Moon image...")
response = requests.get(MOON_IMAGE_URL)

if response.status_code == 200:
    with open(filename, "wb") as f:
        f.write(response.content)
    print("Saved:", filename)
else:
    raise Exception(f"Failed with status {response.status_code}")
