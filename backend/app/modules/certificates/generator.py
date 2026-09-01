import io
import math
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import segno
from fpdf import FPDF

from app.core.config import settings
from app.shared import storage

_SUBDIR = "certificates"

# Assets de marca versionados en el backend (app/core/assets). Se resuelven
# relativos al paquete para no depender del directorio de trabajo ni de rutas
# externas que no existen en la imagen Docker.
_ASSETS_DIR = Path(__file__).resolve().parents[2] / "core" / "assets"
_LOGO_PATH = _ASSETS_DIR / "cas-logo-horizontal.png"
_SEAL_ICON_PATH = _ASSETS_DIR / "cas-logo-icon.png"
_FONTS_DIR = _ASSETS_DIR / "fonts"

# Paleta de marca CAS (design system: rojo / oro / gris).
_RED = (222, 6, 19)
_GOLD = (236, 154, 41)
_GOLD_LIGHT = (239, 188, 94)
_GOLD_DARK = (169, 101, 26)
_INK = (17, 24, 39)
_GRAY = (107, 114, 128)
_IVORY = (252, 251, 247)

# Familias tipográficas registradas en el PDF. Se usa Inter (fuente de marca)
# embebida; el flag global permite degradar a Helvetica si los TTF no están
# disponibles, sin romper la emisión del certificado.
_FONT = "Inter"
_FONT_SEMI = "InterSemiBold"

_MONTHS_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

# La fecha del certificado se expresa en la zona horaria de Ecuador (UTC-5, sin
# horario de verano). El instante se guarda en UTC; se usa un offset fijo para
# no depender de la base de datos de zonas horarias (tzdata) del entorno.
_EC_TZ = timezone(timedelta(hours=-5))


def generate_code() -> str:
    raw = uuid.uuid4().hex[:12].upper()
    return f"CAS-{raw[:4]}-{raw[4:8]}-{raw[8:12]}"


def _format_date_es(value: datetime) -> str:
    # Un valor sin tzinfo se asume en UTC (así lo persiste el servicio).
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    local = value.astimezone(_EC_TZ)
    return f"{local.day} de {_MONTHS_ES[local.month - 1]} de {local.year}"


def _verification_url(code: str) -> str:
    # El QR apunta a la página pública de validación del frontend (/verify/:code),
    # no al endpoint JSON del API; esa página consume el API por debajo (BR-030).
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    return f"{base}/verify/{code}"


def _build_qr_png(code: str) -> io.BytesIO:
    buffer = io.BytesIO()
    segno.make(_verification_url(code), error="m").save(
        buffer, kind="png", scale=4, border=1
    )
    buffer.seek(0)
    return buffer


def _register_fonts(pdf: FPDF) -> tuple[str, str]:
    """Registra Inter (Regular/Bold/SemiBold). Degrada a Helvetica si faltan.

    Devuelve las familias a usar para texto normal y semibold. Con Inter
    embebido el PDF admite Unicode (tildes); con Helvetica se mantiene el
    subconjunto latin-1 del núcleo de fpdf.
    """
    regular = _FONTS_DIR / "Inter-Regular.ttf"
    bold = _FONTS_DIR / "Inter-Bold.ttf"
    semibold = _FONTS_DIR / "Inter-SemiBold.ttf"

    if not (regular.exists() and bold.exists() and semibold.exists()):
        return "Helvetica", "Helvetica"

    pdf.add_font(_FONT, "", str(regular))
    pdf.add_font(_FONT, "B", str(bold))
    pdf.add_font(_FONT_SEMI, "", str(semibold))
    return _FONT, _FONT_SEMI


def _text(pdf: FPDF, y: float, text: str, *, align: str = "C") -> None:
    pdf.set_y(y)
    pdf.cell(0, 8, text, align=align)


def _diamond(pdf: FPDF, cx: float, cy: float, r: float, color: tuple) -> None:
    pdf.set_fill_color(*color)
    pdf.polygon(
        [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)],
        fill=True,
    )


def _flourish(pdf: FPDF, cx: float, y: float, half: float) -> None:
    # Filete dorado con un rombo central; separador ornamental reutilizable.
    pdf.set_draw_color(*_GOLD)
    pdf.set_line_width(0.4)
    pdf.line(cx - half, y, cx - 5, y)
    pdf.line(cx + 5, y, cx + half, y)
    _diamond(pdf, cx, y, 1.6, _GOLD)


def build_certificate_pdf(
    *,
    code: str,
    student_name: str,
    course_title: str,
    final_score: float,
    issued_at: datetime,
) -> str:
    """Genera el PDF del certificado y devuelve su ruta relativa de almacenamiento."""
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.set_margins(16, 12, 16)
    pdf.add_page()

    width = pdf.w  # 297 mm
    height = pdf.h  # 210 mm
    cx = width / 2

    font, font_semi = _register_fonts(pdf)

    # Fondo marfil de página completa.
    pdf.set_fill_color(*_IVORY)
    pdf.rect(0, 0, width, height, style="F")

    # Marco doble ornamental: exterior grueso oro, interior fino oro oscuro.
    pdf.set_draw_color(*_GOLD)
    pdf.set_line_width(2.0)
    pdf.rect(11, 11, width - 22, height - 22)
    pdf.set_draw_color(*_GOLD_DARK)
    pdf.set_line_width(0.4)
    pdf.rect(15, 15, width - 30, height - 30)

    # Acentos en las esquinas del filete interior.
    for corner in ((15, 15), (width - 15, 15), (15, height - 15), (width - 15, height - 15)):
        _diamond(pdf, corner[0], corner[1], 2.4, _GOLD)
        _diamond(pdf, corner[0], corner[1], 1.0, _RED)

    # Logo institucional centrado.
    if _LOGO_PATH.exists():
        pdf.image(str(_LOGO_PATH), x=cx - 23, y=22, w=46)

    # Título.
    pdf.set_font(font, "B", 30)
    pdf.set_text_color(*_RED)
    pdf.set_char_spacing(2.0)
    _text(pdf, 52, "CERTIFICADO")
    pdf.set_char_spacing(0)

    pdf.set_font(font_semi, "", 13)
    pdf.set_text_color(*_GOLD_DARK)
    pdf.set_char_spacing(6.0)
    _text(pdf, 67, "DE APROBACIÓN")
    pdf.set_char_spacing(0)

    _flourish(pdf, cx, 80, 46)

    # Cuerpo.
    pdf.set_font(font, "", 12)
    pdf.set_text_color(*_GRAY)
    _text(pdf, 84, "Culinary Arts School otorga el presente certificado a")

    pdf.set_font(font, "B", 32)
    pdf.set_text_color(*_INK)
    _text(pdf, 94, student_name)

    _flourish(pdf, cx, 114, 60)

    pdf.set_font(font, "", 12)
    pdf.set_text_color(*_GRAY)
    _text(pdf, 118, "por haber aprobado satisfactoriamente el curso")

    pdf.set_font(font_semi, "", 19)
    pdf.set_text_color(*_INK)
    pdf.set_y(129)
    pdf.multi_cell(0, 9, course_title, align="C")

    pdf.set_font(font, "", 12)
    pdf.set_text_color(*_GRAY)
    _text(pdf, 149, f"con una calificación final de {final_score:.2f} / 10")

    # ------------------------------------------------------------------ #
    # Pie ceremonial: sello (izq.), firma + fecha (centro), QR (der.).
    # ------------------------------------------------------------------ #
    base_y = height - 46

    # Sello / medallón dorado con el ícono de marca al centro.
    seal_cx, seal_cy, seal_r = 58, base_y + 6, 17
    pdf.set_draw_color(*_GOLD)
    pdf.set_line_width(1.2)
    pdf.ellipse(seal_cx - seal_r, seal_cy - seal_r, seal_r * 2, seal_r * 2)
    pdf.set_draw_color(*_GOLD_DARK)
    pdf.set_line_width(0.4)
    inner_r = seal_r - 2.4
    pdf.ellipse(seal_cx - inner_r, seal_cy - inner_r, inner_r * 2, inner_r * 2)
    for angle in (0, 90, 180, 270):
        rad = math.radians(angle)
        _diamond(
            pdf,
            seal_cx + seal_r * math.cos(rad),
            seal_cy + seal_r * math.sin(rad),
            1.3,
            _GOLD,
        )
    if _SEAL_ICON_PATH.exists():
        icon = 16
        pdf.image(str(_SEAL_ICON_PATH), x=seal_cx - icon / 2, y=seal_cy - icon / 2, w=icon)

    # Firma central con la fecha de emisión.
    sign_half = 34
    pdf.set_draw_color(*_INK)
    pdf.set_line_width(0.3)
    pdf.line(cx - sign_half, base_y + 8, cx + sign_half, base_y + 8)
    pdf.set_font(font_semi, "", 10)
    pdf.set_text_color(*_INK)
    _text(pdf, base_y + 9.5, "Dirección Académica")
    pdf.set_font(font, "", 9)
    pdf.set_text_color(*_GRAY)
    _text(pdf, base_y + 14.5, f"Quito, {_format_date_es(issued_at)}")

    # QR de verificación pública (BR-030) con el código debajo.
    qr = _build_qr_png(code)
    qr_size = 28
    qr_x = width - 30 - qr_size
    qr_y = base_y - 6
    pdf.image(qr, x=qr_x, y=qr_y, w=qr_size, h=qr_size)
    pdf.set_xy(qr_x - 6, qr_y + qr_size + 1)
    pdf.set_font(font_semi, "", 9)
    pdf.set_text_color(*_INK)
    pdf.cell(qr_size + 12, 4, code, align="C")
    pdf.set_xy(qr_x - 6, qr_y + qr_size + 5)
    pdf.set_font(font, "", 7.5)
    pdf.set_text_color(*_GRAY)
    pdf.cell(qr_size + 12, 4, "Verifica en el código QR", align="C")

    target_dir = storage.resolve_path(_SUBDIR)
    target_dir.mkdir(parents=True, exist_ok=True)
    relative_path = f"{_SUBDIR}/{code}.pdf"

    storage.resolve_path(relative_path).write_bytes(bytes(pdf.output()))
    return relative_path
