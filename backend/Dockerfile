# Use the highly optimized Python 3.12 slim base image
FROM python:3.12-slim

# Prevent Python from writing pyc bytecode files and force immediate log output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Upgrade pip and install pre-compiled data science packages instantly
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of your Django backend source code
COPY . .

# Expose the standard Django server port
EXPOSE 8000

# Automatically start the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
