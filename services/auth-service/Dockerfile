FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY . /app
ENV PYTHONPATH=/app

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl --fail http://localhost:8001/health || exit 1
CMD ["uvicorn", "app:app", "--app-dir", "services/auth-service", "--host", "0.0.0.0", "--port", "8001"]
