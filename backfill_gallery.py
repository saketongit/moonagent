import json
from datetime import datetime
from math import cos, pi

GALLERY_FILE = "gallery.json"

# -------------------------------
# Phase metadata (single source)
# -------------------------------
PHASE_INFO = {
    "New Moon": {
        "icon": "🌑",
        "meaning": "The Moon is between Earth and Sun, invisible in the sky."
    },
    "Waxing Crescent": {
        "icon": "🌒",
        "meaning": "A thin crescent appears as sunlight slowly returns."
    },
    "First Quarter": {
        "icon": "🌓",
        "meaning": "Half of the Moon is illuminated, growing brighter."
    },
    "Waxing Gibbous": {
        "icon": "🌔",
        "meaning": "The Moon is mostly lit, approaching fullness."
    },
    "Full Moon": {
        "icon": "🌕",
        "meaning": "The Moon’s face is fully illuminated."
    },
    "Waning Gibbous": {
        "icon": "🌖",
        "meaning": "Light begins to fade after the full Moon."
    },
    "Last Quarter": {
        "icon": "🌗",
        "meaning": "Half of the Moon is illuminated, fading."
    },
    "Waning Crescent": {
        "icon": "🌘",
        "meaning": "A thin crescent remains before the next New Moon."
    }
}

# -------------------------------
# Distance calculation
# (simple lunar orbit approximation)
# -------------------------------
PERIGEE = 363300  # km
APOGEE = 405500   # km
SYNODIC_MONTH = 29.53058867

def distance_from_earth(age_days):
    phase_angle = 2 * pi * age_days / SYNODIC_MONTH
    eccentricity = (APOGEE - PERIGEE) / 2
    return int((APOGEE + PERIGEE) / 2 - eccentricity * cos(phase_angle))


# -------------------------------
# Run backfill
# -------------------------------
print("🌕 MoonAgent Backfill Started")
print("----------------------------------")

with open(GALLERY_FILE, "r", encoding="utf-8") as f:
    gallery = json.load(f)

updated_count = 0

for item in gallery["images"]:
    date = item.get("date", "unknown")
    print(f"📅 Processing {date}")

    changed = False

    # Phase icon & meaning
    phase = item.get("phase")
    if phase and phase in PHASE_INFO:
        if "phase_icon" not in item:
            item["phase_icon"] = PHASE_INFO[phase]["icon"]
            print("   ➕ phase_icon added")
            changed = True

        if "phase_meaning" not in item:
            item["phase_meaning"] = PHASE_INFO[phase]["meaning"]
            print("   ➕ phase_meaning added")
            changed = True

    # Distance
    if "distance_km" not in item and "age_days" in item:
        item["distance_km"] = distance_from_earth(item["age_days"])
        print("   ➕ distance_km added")
        changed = True

    if changed:
        updated_count += 1
    else:
        print("   ✓ already complete")

print("----------------------------------")
print(f"✅ Backfill complete — updated {updated_count} entries")

with open(GALLERY_FILE, "w", encoding="utf-8") as f:
    json.dump(gallery, f, indent=2)

print("📁 gallery.json written successfully")
