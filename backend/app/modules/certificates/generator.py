import io
import uuid
from datetime import datetime
from pathlib import Path

import segno
from fpdf import FPDF

from app.core.config import settings
from app.shared import storage

_SUBDIR = "certificates"

# Logo institucional opcional; si no está disponible en el entorno (p. ej. la
# imagen no se copió a la imagen Docker), el certificado se emite sin él.
_LOGO_PATH = Path(__file__).resolve().parents[4] / "templates" / "assets" / "CAS_logo.png"

# Paleta de marca CAS (colors_and_type.css).
_RED = (222, 6, 19)
_GOLD = (236, 154, 41)
_INK = (17, 24, 39)
_GRAY = (107, 114, 128)

_MONTHS_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def generate_code() -> str:
    raw = uuid.uuid4().hex[:12].upper()
    return f"CAS-{raw[:4]}-{raw[4:8]}-{raw[8:12]}"


def _format_date_es(value: datetime) -> str:
    return f"{value.day} de {_MONTHS_ES[value.month - 1]} de {value.year}"


def _verification_url(code: str) -> str:
    base = settings.PUBLIC_BASE_URL.rstrip("/")
    return f"{base}{settings.API_V1_PREFIX}/certificates/verify/{code}"


def _build_qr_png(code: str) -> io.BytesIO:
    buffer = io.BytesIO()
    segno.make(_verification_url(code), error="m").save(
        buffer, kind="png", scale=4, border=1
    )
    buffer.seek(0)
    return buffer


def build_certificate_pdf(
    *,
    code: str,
    student_name: str,
    course_title: str,
    average_score: float,
    issued_at: datetime,
) -> str:
    """Genera el PDF del certificado y devuelve su ruta relativa de almacenamiento."""
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()

    width = pdf.w
    height = pdf.h

    # Marco doble: filete exterior gris y filete interior dorado.
    pdf.set_draw_color(*_GRAY)
    pdf.set_line_width(0.6)
    pdf.rect(8, 8, width - 16, height - 16)
    pdf.set_draw_color(*_GOLD)
    pdf.set_line_width(1.4)
    pdf.rect(12, 12, width - 24, height - 24)

    if _LOGO_PATH.exists():
        pdf.image(str(_LOGO_PATH), x=width / 2 - 22, y=22, w=44)

    pdf.set_y(58)
    pdf.set_font("Helvetica", "B", 30)
    pdf.set_text_color(*_RED)
    pdf.cell(0, 14, "CERTIFICADO DE APROBACION", align="C")

    pdf.set_y(78)
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(*_GRAY)
    pdf.cell(0, 8, "Culinary Arts School certifica que", align="C")

    pdf.set_y(92)
    pdf.set_font("Helvetica", "B", 34)
    pdf.set_text_color(*_INK)
    pdf.cell(0, 16, student_name, align="C")

    # Línea decorativa bajo el nombre.
    pdf.set_draw_color(*_GOLD)
    pdf.set_line_width(0.5)
    pdf.line(width / 2 - 60, 112, width / 2 + 60, 112)

    pdf.set_y(118)
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(*_GRAY)
    pdf.cell(0, 8, "ha completado satisfactoriamente el curso", align="C")

    pdf.set_y(130)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*_INK)
    pdf.multi_cell(0, 10, course_title, align="C")

    pdf.set_y(150)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(*_GRAY)
    pdf.cell(
        0,
        8,
        f"con una calificacion promedio de {average_score:.2f} / 10",
        align="C",
    )

    # Pie: fecha de emisión a la izquierda, código y QR a la derecha.
    pdf.set_xy(28, height - 48)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*_INK)
    pdf.cell(90, 6, _format_date_es(issued_at), align="L")
    pdf.set_xy(28, height - 42)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*_GRAY)
    pdf.cell(90, 6, "Fecha de emision", align="L")

    qr = _build_qr_png(code)
    qr_size = 26
    qr_x = width - 28 - qr_size
    pdf.image(qr, x=qr_x, y=height - 52, w=qr_size, h=qr_size)
    pdf.set_xy(qr_x - 70, height - 40)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*_INK)
    pdf.cell(68, 5, code, align="R")
    pdf.set_xy(qr_x - 70, height - 34)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*_GRAY)
    pdf.cell(68, 5, "Verifique en el codigo QR", align="R")

    target_dir = storage.resolve_path(_SUBDIR)
    target_dir.mkdir(parents=True, exist_ok=True)
    relative_path = f"{_SUBDIR}/{code}.pdf"

    storage.resolve_path(relative_path).write_bytes(bytes(pdf.output()))
    return relative_path
