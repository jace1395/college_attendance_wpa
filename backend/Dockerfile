# Pull the latest Python 3.14 slim environment
FROM python:3.14-slim

# Install building tools required to compile data science extensions locally
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Stop Python from building secondary bytecode and force raw logs out instantly
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Establish application home
WORKDIR /app

# Copy requirement blocks and run pip upgrades directly
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Bind backend workspace
COPY . .

# Expose standard Django endpoint
EXPOSE 8000

# Launch server mapped to catch out-of-container calls
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
