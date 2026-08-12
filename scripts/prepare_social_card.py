import argparse
from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]


parser = argparse.ArgumentParser(description="Prepara la imagen social de 1200 × 630 px.")
parser.add_argument("source", type=Path, help="Imagen de origen.")
parser.add_argument(
    "--destination",
    type=Path,
    default=PROJECT_ROOT / "public" / "og.png",
    help="PNG de salida (por defecto public/og.png).",
)
options = parser.parse_args()

source = options.source.resolve()
destination = options.destination.resolve()
destination.parent.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = ImageOps.fit(image, (1200, 630), method=Image.Resampling.LANCZOS)
    image.save(destination, "PNG", optimize=True)

print(destination)
