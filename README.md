# 📦 InkLabel Pro

> **AI-Powered Delivery Labeling System.** 
> Extract, Design, and Print delivery labels directly from Invoice PDFs or Camera captures with one click.

---

## ✨ Features

- **📄 Smart Document Extraction**: Upload an invoice PDF and automatically extract customer names, workplaces, and printer models using robust OCR.
- **📸 Mobile-First Camera Flow**: Snapshot a delivery note on your phone; our backend handles the image processing and data extraction instantly.
- **🎨 Visual Label Designer**: Tweak font sizes and element positions in real-time before printing.
- **🖨️ Brother Printer Integration**: Direct USB printing support for **Brother QL-800** series using `brother_ql`.
- **🗃️ Database Management**: Full history of printed labels with search, filter, and manual editing capabilities.
- **🌓 Modern UI**: Sleek, responsive interface with Dark Mode support.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework.
- **Tesseract OCR**: Neural network-based OCR for German/English text extraction.
- **SQLAlchemy + SQLite**: Lightweight, local-first data persistence.
- **OpenCV + Pillow**: Advanced image processing for document rectification.

### Frontend
- **React + TypeScript**: Type-safe, component-based architecture.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling with custom glassmorphism effects.
- **Lucide Icons**: Beautiful, minimal iconography.

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- For physical printing: A **Brother QL-800** series printer connected via USB.

### Quick Run (Production Mode)

The easiest way to get started is using the unified Docker image:

```bash
docker build -t inklabel-pro .
docker run -p 8000:8000 --privileged -v /dev/bus/usb:/dev/bus/usb inklabel-pro
```

Access the app at: `http://localhost:8000`

### Development Mode

If you want to modify the code and see changes in real-time, use Docker Compose:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

---

## 📁 Project Structure

```text
.
├── backend/            # FastAPI Source Code
│   ├── main.py         # App Entry & API Routes
│   ├── models.py       # DB Schema
│   ├── utils/          # OCR & Printer Logic
│   └── requirements.txt
├── frontend/           # React Source Code
│   ├── src/            # Components & Views
│   └── vite.config.ts  # Proxy Configuration
├── Dockerfile          # Unified Production Build
└── docker-compose.yml  # Development Orchestration
```

---

## ⚖️ Hardware Notes

This application uses `usbutils` and `brother_ql` for direct hardware communication. If you are running inside Docker, the `--privileged` flag and `/dev/bus/usb` volume mapping are **required** for the container to see the printer.

---

## 📝 License

This project is for internal use. All rights reserved.
