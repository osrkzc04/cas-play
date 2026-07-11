#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Seeding base data (roles + admin)..."
python -m app.db.seed_runner

echo "Starting API server..."
# --proxy-headers + forwarded-allow-ips: la API va detras de Plesk y MikroTik;
# confia en X-Forwarded-* para registrar el esquema y la IP real del cliente.
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 \
  --proxy-headers --forwarded-allow-ips="*"
