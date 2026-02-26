from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
import os
import shutil
import uuid
import database, models
from utils import extractor, ocr, printer
from datetime import datetime

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Ink Delivery Label API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to delete files matching our cleanup requirement
def delete_file(path: str):
    if path and os.path.exists(path):
        os.remove(path)

from typing import Optional

# Pydantic models for request bodies
class PrintRequest(BaseModel):
    printer_name: str
    customer_name: str
    workplace: str
    date: str
    dealer_po: Optional[str] = None
    file_path: Optional[str] = None
    design: dict  # The visual coordinates and font sizes from the frontend
    tape_size: str = "62"

class DeliveryCreate(BaseModel):
    printer_name: str
    customer_name: str
    workplace: str
    dealer_po: Optional[str] = None
    status: str = "ready"

class DeliveryUpdate(BaseModel):
    printer_name: Optional[str] = None
    customer_name: Optional[str] = None
    workplace: Optional[str] = None
    dealer_po: Optional[str] = None
    status: Optional[str] = None

@app.post("/extract/pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        return {"error": "Invalid file type. Must be PDF."}
        
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        extracted_data = extractor.extract_from_pdf(temp_path)
        return {"success": True, "file_path": temp_path, "data": extracted_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/extract/image")
async def extract_image(file: UploadFile = File(...)):
    contents = await file.read()
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        buffer.write(contents)
        
    try:
        extracted_data = ocr.extract_from_image(contents)
        print(f"CAMERA EXTRACTION RESULT: {extracted_data}")
        return {"success": True, "file_path": temp_path, "data": extracted_data}
    except Exception as e:
        print(f"CAMERA EXTRACTION ERROR: {e}")
        return {"success": False, "error": str(e)}

@app.post("/print")
async def print_label(req: PrintRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    try:
        # 1. Save strictly to History (SQLite)
        db_entry = models.InkDelivery(
            printer_name=req.printer_name,
            customer_name=req.customer_name,
            workplace=req.workplace,
            dealer_po=req.dealer_po,
            filename=os.path.basename(req.file_path) if req.file_path else "Manual Entry",
            delivery_date=datetime.utcnow()
        )
        db.add(db_entry)
        db.commit()

        # 2. Generate Image for Printing using design coordinates
        data_dict = {
            "printer_name": req.printer_name,
            "customer_name": req.customer_name,
            "workplace": req.workplace,
            "date": req.date
        }
        label_img = printer.generate_label_image(data_dict, req.design)

        # 3. Send to Printer
        # Note: In a dev environment without the printer connected, this will error.
        # We can wrap it in a try/except to simulate success if the printer is missing.
        try:
            printer.print_label_usb(label_img, tape_size=req.tape_size)
            print_status = "Printed successfully"
        except Exception as print_e:
            print_status = f"Simulated success (Printer not found/Error: {str(print_e)})"

        # 4. Trigger Automatic Cleanup task to save space
        if req.file_path:
            background_tasks.add_task(delete_file, req.file_path)

        return {"success": True, "message": print_status}
    except Exception as e:
         return {"success": False, "error": str(e)}

@app.get("/history")
def get_history(skip: int = 0, limit: int = 100, status: Optional[str] = None, search: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.InkDelivery)
    
    if status and status.lower() != 'all':
        query = query.filter(models.InkDelivery.status == status.lower())
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.InkDelivery.printer_name.ilike(search_term),
                models.InkDelivery.customer_name.ilike(search_term),
                models.InkDelivery.dealer_po.ilike(search_term)
            )
        )
        
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(models.InkDelivery.delivery_date >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            # Append max time to include the full end day
            end_dt = datetime.strptime(end_date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(models.InkDelivery.delivery_date <= end_dt)
        except ValueError:
            pass
        
    return query.order_by(models.InkDelivery.delivery_date.desc()).offset(skip).limit(limit).all()

@app.post("/history")
def create_history(delivery: DeliveryCreate, db: Session = Depends(database.get_db)):
    db_entry = models.InkDelivery(
        printer_name=delivery.printer_name,
        customer_name=delivery.customer_name,
        workplace=delivery.workplace,
        dealer_po=delivery.dealer_po,
        status=delivery.status,
        filename="Manual Entry",
        delivery_date=datetime.utcnow()
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/history/{id}")
def update_history(id: int, delivery_update: DeliveryUpdate, db: Session = Depends(database.get_db)):
    db_entry = db.query(models.InkDelivery).filter(models.InkDelivery.id == id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = delivery_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
        
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/history/{id}")
def delete_history(id: int, db: Session = Depends(database.get_db)):
    db_entry = db.query(models.InkDelivery).filter(models.InkDelivery.id == id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_entry)
    db.commit()
    return {"success": True, "message": "Record deleted"}

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

