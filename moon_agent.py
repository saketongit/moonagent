import requests
from datetime import date
import shutil
import os
import json
import re


from math import cos, pi
from datetime import datetime

SYNODIC_MONTH = 29.53058867
KNOWN_NEW_MOON = datetime(2000, 1, 6)  # reference new moon


def moon_age(date):
    days_since = (date - KNOWN_NEW_MOON).total_seconds() / 86400.0
    return days_since % SYNODIC_MONTH


def illumination(age):
    phase_angle = 2 * pi * age / SYNODIC_MONTH
    return (1 - cos(phase_angle)) / 2


def phase_name(age):
    if age < 1.8:
        return "New Moon"
    elif age < 5.5:
        return "Waxing Crescent"
    elif age < 9.2:
        return "First Quarter"
    elif age < 12.9:
        return "Waxing Gibbous"
    elif age < 16.6:
        return "Full Moon"
    elif age < 20.3:
        return "Waning Gibbous"
    elif age < 23.9:
        return "Last Quarter"
    elif age < 27.7:
        return "Waning Crescent"
    else:
        return "New Moon"

NASA_MOON_PAGE = "https://science.nasa.gov/moon/daily-moon-guide/"

def get_today_moon_image_url():
    response = requests.get(NASA_MOON_PAGE, timeout=20)
    response.raise_for_status()

    html = response.text

    # 1️⃣ Try OpenGraph image (most reliable)
    og_match = re.search(
        r'<meta property="og:image" content="([^"]+moon\.\d+\.jpg)"',
        html
    )
    if og_match:
        return og_match.group(1)

    # 2️⃣ Fallback: first large moon image in page
    img_match = re.search(
        r'<img[^>]+src="([^"]+moon\.\d+\.jpg)"',
        html
    )
    if img_match:
        return img_match.group(1)

    raise Exception("Could not determine today's Moon image")



print("Fetching today's Moon image URL from NASA...")
MOON_IMAGE_URL = get_today_moon_image_url()
print("Using Moon image:", MOON_IMAGE_URL)


# Config
MAX_ENTRIES = 14
IMAGES_DIR = "images"
GALLERY_FILE = "gallery.json"

today = date.today().isoformat()
today_dt = datetime.utcnow()
age = moon_age(today_dt)
illum = illumination(age)
phase = phase_name(age)

illum_pct = round(illum * 100, 1)
age_days = round(age, 1)

daily_name = f"moon_{today}.jpg"
daily_path = os.path.join(IMAGES_DIR, daily_name)
latest_path = os.path.join(IMAGES_DIR, "latest.jpg")

# Ensure images folder exists
os.makedirs(IMAGES_DIR, exist_ok=True)

print("Downloading Moon image...")
response = requests.get(MOON_IMAGE_URL)

if response.status_code != 200:
    raise Exception(f"Failed with status {response.status_code}")

# Save daily image
with open(daily_path, "wb") as f:
    f.write(response.content)

# Update latest
shutil.copyfile(daily_path, latest_path)

print("Saved:", daily_path)
print("Updated:", latest_path)

# Load or initialize gallery.json
if os.path.exists(GALLERY_FILE):
    with open(GALLERY_FILE, "r", encoding="utf-8") as f:
        gallery = json.load(f)
else:
    gallery = {"updated_at": today, "images": []}

# Compute diff from yesterday (if available)
diff = None

if gallery["images"]:
    yesterday = gallery["images"][0]

    diff = {
        "illumination_delta": round(
            illum_pct - yesterday.get("illumination", 0), 1
        ),
        "age_delta": round(
            age_days - yesterday.get("age_days", 0), 1),
        "phase_changed": phase != yesterday.get("phase")
    }

# Remove today if it already exists (idempotent runs)
gallery["images"] = [
    item for item in gallery["images"] if item["date"] != today
]

# Prepend today
gallery["images"].insert(0, {
    "date": today,
    "file": daily_path.replace("\\", "/"),
    "phase": phase,
    "illumination": illum_pct,
    "age_days": age_days,
    "diff": diff
})


# Trim to MAX_ENTRIES
gallery["images"] = gallery["images"][:MAX_ENTRIES]
gallery["updated_at"] = today

# Save gallery.json
with open(GALLERY_FILE, "w", encoding="utf-8") as f:
    json.dump(gallery, f, indent=2)

print("Updated gallery.json")
