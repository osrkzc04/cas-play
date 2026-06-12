from app.db.seed import seed_admin, seed_roles
from app.db.session import SessionLocal


def run_seed() -> None:
    db = SessionLocal()

    try:
        seed_roles(db)
        seed_admin(db)
        print("Seed completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()