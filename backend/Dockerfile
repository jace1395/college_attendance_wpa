# Use Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
# build-essential is needed by some C-extension packages (e.g. pandas).
# libpq-dev is NOT required because we use psycopg2-binary (self-contained).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
# Everything (gunicorn, psycopg2-binary, etc.) is declared in requirements.txt.
COPY requirements.txt .
RUN pip install --no-cache-dir uv && \
    uv pip install --system -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Collect static files (needed if WhiteNoise / admin is in use)
# RUN python manage.py collectstatic --noinput

# Copy and wire up the entrypoint script
# This ensures migrations + seed_core_users run on EVERY startup,
# so admin@sdcce.edu / Sdcce@{year} always works out of the box.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
