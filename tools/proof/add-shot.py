#!/usr/bin/env python3
"""Turn ONE already-redacted screenshot into the fast proof set.

    python3 tools/proof/add-shot.py path/to/redacted.png my-slug

Writes IMAGES/proof/fast/<slug>-320.{avif,webp} and -720.{avif,webp}.
Redact FIRST (solid rectangles over names, photos, numbers, amounts,
receipts, passwords, PINs), then run this. This script does not redact.
Look at the output before you list it in manifest.json.
"""
import sys, os, re
from PIL import Image

if len(sys.argv) != 3 or not re.fullmatch(r'[a-z0-9-]+', sys.argv[2]):
    sys.exit(__doc__)
src, slug = sys.argv[1], sys.argv[2]
root = os.path.join(os.path.dirname(__file__), '..', '..', 'IMAGES', 'proof', 'fast')
os.makedirs(root, exist_ok=True)
im = Image.open(src).convert('RGB')   # convert() drops EXIF/metadata
for w, avif_q, webp_q in ((320, 38, 45), (720, 42, 52)):
    r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    r.save(f'{root}/{slug}-{w}.avif', 'AVIF', quality=avif_q, speed=2)
    r.save(f'{root}/{slug}-{w}.webp', 'WEBP', quality=webp_q, method=6)
    print(slug, w, os.path.getsize(f'{root}/{slug}-{w}.avif'), 'B avif')
