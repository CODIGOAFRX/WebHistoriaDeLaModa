from pathlib import Path
from PIL import Image, ImageOps


source = Path(
    r"C:\Users\USUARIO\.codex\generated_images\019ff1e7-99b5-77e1-b466-b303544d1122\exec-8ab68c13-5ae9-42e9-bc16-dc2203b0faa0.png"
)
destination = Path(__file__).resolve().parents[1] / "public" / "og.png"

with Image.open(source) as image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = ImageOps.fit(image, (1200, 630), method=Image.Resampling.LANCZOS)
    image.save(destination, "PNG", optimize=True)

print(destination)
