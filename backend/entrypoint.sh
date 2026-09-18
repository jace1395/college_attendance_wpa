#!/bin/sh
# entrypoint.sh — runs on every `docker compose up`

set -e

echo ">>> Running database migrations..."
python manage.py migrate --noinput

echo ">>> Seeding core users (Admin + Principal)..."
python manage.py seed_core_users

echo ">>> Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 attendance_wpa.wsgi:application
