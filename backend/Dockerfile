FROM python:3.12-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r ./requirements.txt
COPY backend/ ./backend/
COPY content/ ./content/

EXPOSE 5000
# Les migrations passent avant chaque démarrage : la base suit le code sans action manuelle.
CMD ["sh", "-c", "python backend/migrate.py && exec flask --app backend/app run --host=0.0.0.0 --port=5000"]
