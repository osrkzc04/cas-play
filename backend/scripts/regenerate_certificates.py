"""Regenera los PDF de certificados ya emitidos con el diseño vigente.

Los datos del certificado están congelados en la tabla `certificates` (BR-029),
por lo que la regeneración es determinista: reconstruye el PDF desde el registro
sin reabrir el flujo de emisión ni recalcular la nota. El archivo mantiene su
nombre `{code}.pdf`, de modo que se sobrescribe en sitio y `pdf_path` no cambia.

Ejecutar desde `backend/`:

    python scripts/regenerate_certificates.py            # todos
    python scripts/regenerate_certificates.py CAS-XXXX-... # solo uno
"""

import sys

# Registra el metadata completo (FKs a users/courses) antes de mapear Certificate.
import app.db.init_db  # noqa: F401
from app.db.session import SessionLocal
from app.modules.certificates import generator
from app.modules.certificates.models import Certificate


def main() -> None:
    code = sys.argv[1] if len(sys.argv) > 1 else None

    db = SessionLocal()
    try:
        query = db.query(Certificate)
        if code is not None:
            query = query.filter(Certificate.code == code)
        certificates = query.all()

        if not certificates:
            print("No se encontraron certificados para regenerar.")
            return

        for certificate in certificates:
            path = generator.build_certificate_pdf(
                code=certificate.code,
                student_name=certificate.student_name,
                course_title=certificate.course_title,
                final_score=float(certificate.final_score),
                issued_at=certificate.issued_at,
            )
            certificate.pdf_path = path
            print(f"OK  {certificate.code} -> {path}")

        db.commit()
        print(f"Regenerados {len(certificates)} certificado(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
