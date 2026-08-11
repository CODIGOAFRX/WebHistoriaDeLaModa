from pathlib import Path
from PIL import Image, ImageOps


SOURCE = Path(r"C:\Users\USUARIO\Desktop\CODE\historia de la moda web\Web Historia de la moda")
DESTINATION = Path(__file__).resolve().parents[1] / "public" / "images"


def save_raster(source: Path, destination: Path, size: tuple[int, int], *, crop: bool = True) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if crop:
            image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)
        else:
            image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=86, method=6)


def save_logo(source: Path, destination: Path, width: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        height = round(width * image.height / image.width)
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        image.save(destination, "PNG", optimize=True)


save_logo(
    SOURCE / "Logotipos" / "01-Historia-de-la-Moda-Logo-Dos-tintas.png",
    DESTINATION / "brand" / "logo-wordmark.png",
    900,
)
save_logo(
    SOURCE / "Logotipos" / "01-Historia-de-la-Moda-Logo-Blanco.png",
    DESTINATION / "brand" / "logo-wordmark-white.png",
    900,
)
save_logo(
    SOURCE / "Logotipos" / "02-Historia-de-la-Moda-Icono-Dos-tintas.png",
    DESTINATION / "brand" / "logo-icon.png",
    512,
)
save_logo(
    SOURCE / "Logotipos" / "02-Historia-de-la-Moda-Icono-Blanco.png",
    DESTINATION / "brand" / "logo-icon-white.png",
    512,
)

photo_jobs = [
    ("FOTOS/a923b55e-abc9-4366-89d6-6930c18dca1b.png", "portraits/carlos-hero.webp", (1120, 1400), True),
    ("FOTOS/PHOTO-2023-05-16-19-02-57 5.jpg", "portraits/carlos-about.webp", (1440, 1080), True),
    ("FOTOS/PHOTO-2023-05-16-19-02-57 6.jpg", "media/carlos-tv.webp", (1440, 1080), True),
    ("FOTOS/PHOTO-2023-05-16-19-02-57 4.jpg", "media/carlos-tv-detail.webp", (1440, 1080), True),
    ("FOTOS/conferencia.jpg", "media/carlos-conference.webp", (1600, 1067), True),
    ("FOTOS/portada instagram 2.jpg", "media/carlos-classroom.webp", (1600, 900), True),
    ("PRENSA/Foto 16-10-2022, 11 33 00.jpg", "media/press-clipping.webp", (900, 1160), False),
    ("VARIOS/f072895f-de7b-4b72-b6d8-4c2f914de0c4_400x400.png", "media/all-that-she-wants.webp", (800, 800), True),
]

for source_name, destination_name, size, crop in photo_jobs:
    save_raster(SOURCE / source_name, DESTINATION / destination_name, size, crop=crop)

podcast_jobs = [
    ("00.png", "00-serie.webp"),
    ("000d.png", "00-serie-alt.webp"),
    ("01-Si Balenciaga levantara la cabeza.png", "01-balenciaga.webp"),
    ("02-La primera influencer de la historia 2.png", "02-primera-influencer.webp"),
    ("03 - de la guillotina al algoritmob.png", "03-guillotina-algoritmo.webp"),
    ("04 Pioneras e Insumisas 02.jpg", "04-pioneras-insumisas.webp"),
    ("05 Los fortuny.png", "05-fortuny.webp"),
    ("06 Modas que matan.png", "06-modas-que-matan.webp"),
    ("07 Escultores de la moda.png", "07-escultores-moda.webp"),
    ("09 Christian Dior.png", "09-christian-dior.webp"),
    ("10 Colores 1.png", "10-colores-moda.webp"),
    ("11 de la modelo a la influencer.png", "11-modelo-influencer.webp"),
    ("12 Colores 2.png", "12-colores-lujo.webp"),
    ("13 Pelucas.png", "13-pelucas.webp"),
]

for source_name, destination_name in podcast_jobs:
    save_raster(
        SOURCE / "PODCAST" / source_name,
        DESTINATION / "podcasts" / destination_name,
        (900, 900),
        crop=True,
    )

print(f"Prepared assets in {DESTINATION}")
