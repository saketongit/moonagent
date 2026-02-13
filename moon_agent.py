import requests
from datetime import datetime, date
import shutil
import os
import json
from math import cos, pi
SVS_FRAME_OFFSET = 0



def get_latest_completed_slot(now_utc: datetime) -> datetime:
    """
    Returns the latest completed 6-hour UTC slot as a datetime.
    Slots: 00, 06, 12, 18
    """
    slot_hour = (now_utc.hour // 6) * 6
    return now_utc.replace(
        hour=slot_hour,
        minute=0,
        second=0,
        microsecond=0
    )


def hour_of_year(dt: datetime) -> int:
    """
    Returns 0-based hour index since Jan 1, 00:00 UTC of the same year.
    """
    start_of_year = datetime(dt.year, 1, 1)
    delta = dt - start_of_year
    return int(delta.total_seconds() // 3600)

def svs_frame_index(slot_dt: datetime) -> int:
    """
    Maps a UTC slot datetime to the correct SVS hourly frame index.
    """
    return hour_of_year(slot_dt) + SVS_FRAME_OFFSET


def get_moon_image_url_for_slot(slot_dt: datetime) -> str:
    """
    Returns the SVS image URL for a given 6-hour slot datetime.
    """
    frame = svs_frame_index(slot_dt)
    return f"{FRAME_BASE_URL}moon.{frame:04d}.jpg"



FRAME_BASE_URL = (
    "https://svs.gsfc.nasa.gov/vis/a000000/a005500/"
    "a005587/frames/730x730_1x1_30p/"
)

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




# Config
MAX_ENTRIES = 14
IMAGES_DIR = "images"
GALLERY_FILE = "gallery.json"

now_utc = datetime.utcnow()
slot_dt = get_latest_completed_slot(now_utc)

slot_date_str = slot_dt.date().isoformat()
slot_hour = slot_dt.hour
hour_index = hour_of_year(slot_dt)
print("Hour-of-year index:", hour_index)



IS_DAILY_ARCHIVE_SLOT = (slot_hour == 18)

print("Observation slot:", slot_date_str, f"{slot_hour:02d}:00 UTC")
print("Daily archive slot:", IS_DAILY_ARCHIVE_SLOT)




print("Computing today's Moon image via frame math...")
MOON_IMAGE_URL = get_moon_image_url_for_slot(slot_dt)
print("Using Moon image:", MOON_IMAGE_URL)
today_dt = slot_dt
today = slot_dt.date().isoformat()
age = moon_age(today_dt)
illum = illumination(age)
phase = phase_name(age)

illum_pct = round(illum * 100, 1)
age_days = round(age, 1)

daily_name = f"moon_{today}_{slot_hour:02d}.jpg"
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

# --- Update gallery.json (single source of truth) ---

if os.path.exists(GALLERY_FILE):
    with open(GALLERY_FILE, "r", encoding="utf-8") as f:
        gallery = json.load(f)
else:
    gallery = {"updated_at": today, "images": []}

# Remove today's entry if it already exists
gallery["images"] = [
    item for item in gallery["images"] if item["date"] != today
]

# Insert / update today's entry (live-updating)
gallery["images"].insert(0, {
    "date": today,
    "file": daily_path.replace("\\", "/"),
    "phase": phase,
    "illumination": illum_pct,
    "age_days": age_days,
    "diff": None
})

# If this is the 18:00 UTC slot, finalize and cleanup
if slot_hour == 18:
    print("Finalizing daily archive and cleaning up intraday images...")

    if len(gallery["images"]) > 1:
        yesterday = gallery["images"][1]
        gallery["images"][0]["diff"] = {
            "illumination_delta": round(
                illum_pct - yesterday.get("illumination", 0), 1
            ),
            "age_delta": round(
                age_days - yesterday.get("age_days", 0), 1
            ),
            "phase_changed": phase != yesterday.get("phase")
        }

    for filename in os.listdir(IMAGES_DIR):
        if not filename.startswith(f"moon_{today}_"):
            continue
        if filename == f"moon_{today}_18.jpg":
            continue
        os.remove(os.path.join(IMAGES_DIR, filename))
        print("Deleted:", filename)

gallery["updated_at"] = today

with open(GALLERY_FILE, "w", encoding="utf-8") as f:
    json.dump(gallery, f, indent=2)

print("gallery.json updated successfully")

