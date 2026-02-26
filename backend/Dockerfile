FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Tesseract OCR, OpenCV, and Brother Printer (USB)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-deu \
    libgl1 \
    libglib2.0-0 \
    usbutils \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose FastAPI port
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
