# Importa el agregador de modelos para registrar todas las entidades en el
# registry de SQLAlchemy antes de consultar. Sin esto, configurar el mapper de
# User falla al no localizar relaciones como InstructorProfile en este proceso
# aislado.
from app.core.config import settings
from app.db import init_db  # noqa: F401
from app.db.seed import seed_admin, seed_demo_users, seed_roles
from app.db.session import SessionLocal


def run_seed() -> None:
    db = SessionLocal()

    try:
        seed_roles(db)
        seed_admin(db)

        # Las cuentas demo (docente/estudiante) solo se crean fuera de
        # producción; en producción únicamente se siembra el admin desde
        # variables de entorno.
        if settings.ENVIRONMENT != "production":
            seed_demo_users(db)

        print("Seed completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()