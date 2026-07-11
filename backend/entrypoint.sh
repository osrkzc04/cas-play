#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Seeding base data (roles + admin)..."
python -m app.db.seed_runner

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
