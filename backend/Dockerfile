FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

# Producción: el entrypoint aplica migraciones, seed idempotente y arranca uvicorn
# sin --reload. Se usa CMD (no ENTRYPOINT) para que docker-compose.yml (dev) pueda
# sobreescribir el comando y conservar hot-reload.
CMD ["./entrypoint.sh"]