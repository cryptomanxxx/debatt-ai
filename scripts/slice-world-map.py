"""
Skär upp världskartan (public/world-map.png) i 15 regioner (5×3 rutnät).
Utdata: public/regions/region-01.png ... region-15.png

Kör: python scripts/slice-world-map.py
Kräver: pip install Pillow
"""

from PIL import Image
import os
import sys

COLS = 5
ROWS = 3
INPUT  = os.path.join(os.path.dirname(__file__), "..", "public", "world-map.png")
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "regions")

REGION_NAMES = [
    "Arktis",        "Barrskog",     "Klipphöjder",   "Tundra",       "Glaciärvik",
    "Fjordkust",     "Odlingsland",  "Storstad",      "Stäpp",        "Vulkanrev",
    "Mangrovkust",   "Djungel",      "Floddelta",     "Rödöknen",     "Korallkust",
]

def main():
    if not os.path.exists(INPUT):
        print(f"FEL: Hittade inte {INPUT}")
        print("Ladda upp din världskartbild som public/world-map.png och kör igen.")
        sys.exit(1)

    os.makedirs(OUTPUT, exist_ok=True)
    img = Image.open(INPUT)
    w, h = img.size
    print(f"Källbild: {w}×{h} px  (AR = {w/h:.3f}, optimal 5:3 = 1.667)")

    rw = w // COLS
    rh = h // ROWS
    print(f"Region-storlek: {rw}×{rh} px per region\n")

    for row in range(ROWS):
        for col in range(COLS):
            idx = row * COLS + col
            name = REGION_NAMES[idx]
            x1 = col * rw
            y1 = row * rh
            x2 = x1 + rw if col < COLS - 1 else w   # sista kolumnen tar resten
            y2 = y1 + rh if row < ROWS - 1 else h   # sista raden tar resten
            region = img.crop((x1, y1, x2, y2))
            filename = f"region-{idx+1:02d}.png"
            path = os.path.join(OUTPUT, filename)
            region.save(path, "PNG", optimize=True)
            print(f"  {filename}  ({name})  {x1},{y1} → {x2},{y2}  ({x2-x1}×{y2-y1}px)")

    print(f"\nKlart! {COLS*ROWS} regioner sparade i public/regions/")

if __name__ == "__main__":
    main()
