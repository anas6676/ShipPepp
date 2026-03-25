# --- Stage 1: Build the Backend Environment ---
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Build the Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
RUN npm run build

# --- Stage 3: Final Production Image ---
FROM python:3.11-slim

WORKDIR /app

# Install Runtime System Dependencies (OCR, OpenCV, Brother Printer USB)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-deu \
    libgl1 \
    libglib2.0-0 \
    usbutils \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies from builder
COPY --from=backend-builder /install /usr/local

# Copy backend source code
COPY backend/ .

# Copy frontend build to a folder named 'frontend'
# This is where main.py expects to find it
COPY --from=frontend-builder /app/dist ./frontend

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Run with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]