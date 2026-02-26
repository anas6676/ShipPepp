from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class InkDelivery(Base):
    __tablename__ = "ink_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    printer_name = Column(String, index=True)
    customer_name = Column(String, index=True)
    workplace = Column(String, index=True)
    delivery_date = Column(DateTime, default=datetime.datetime.utcnow)
    filename = Column(String) # To keep track of what was uploaded (before deletion)
    dealer_po = Column(String, nullable=True) # E.g. EB26016735
    status = Column(String, default="ready") # "ready" or "delivered"
