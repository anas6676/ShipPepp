from brother_ql.conversion import convert
from brother_ql.backends.helpers import send
from brother_ql.raster import BrotherQLRaster
from brother_ql.models import ALL_MODELS
from PIL import Image, ImageDraw, ImageFont
import os

# Default values
PRINTER_MODEL = 'QL-800'
PRINTER_PORT = 'usb://0x04f9:0x209b' # Default Brother QL-800 USB Vendor/Product ID

def generate_label_image(data: dict, design: dict) -> Image:
    """
    Generates a PIL Image of the label based on the extracted data and 
    the designer config sent from the frontend.
    """
    # Assuming standard 62mm continuous tape for testing geometry, 
    # brother_ql uses specific pixel widths. For 62mm: 696 pixels wide.
    # We create a baseline canvas. Length can be dynamic.
    img_width = 696
    img_height = design.get("height", 400) # Length in pixels
    
    # Create white canvas
    img = Image.new('RGB', (img_width, img_height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Use default font or load a TTF if available
    try:
         # Try to load a generic sans-serif font
         font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", design.get("printer_name_size", 40))
         font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", design.get("customer_name_size", 30))
         font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", design.get("workplace_size", 24))
    except IOError:
         # Fallback to default
         font_large = font_medium = font_small = ImageFont.load_default()

    # Draw elements based on design coordinates from frontend
    draw.text((design.get("printer_name_x", 20), design.get("printer_name_y", 20)), 
              f"Printer: {data.get('printer_name', 'N/A')}", font=font_large, fill='black')
              
    draw.text((design.get("customer_name_x", 20), design.get("customer_name_y", 80)), 
              f"Customer: {data.get('customer_name', 'N/A')}", font=font_medium, fill='black')
              
    draw.text((design.get("workplace_x", 20), design.get("workplace_y", 140)), 
              f"Workplace: {data.get('workplace', 'N/A')}", font=font_small, fill='black')
              
    draw.text((design.get("date_x", 20), design.get("date_y", 200)), 
              f"Date: {data.get('date', 'N/A')}", font=font_small, fill='black')

    return img

def print_label_usb(image: Image, tape_size: str = "62"):
    """
    Sends the PIL image directly to the printer via USB.
    """
    # Prepare raster instructions
    qlr = BrotherQLRaster(PRINTER_MODEL)
    qlr.exception_on_warning = True
    
    # Needs to be rotated 90 degrees or tailored to brother_ql specifics based on tape
    instructions = convert(
        qlr=qlr, 
        images=[image], 
        label=tape_size, 
        rotate='90',    
        threshold=70.0, 
        dither=False, 
        compress=False, 
        red=False
    )
    
    # Send instructions over USB
    # Note: On Raspberry Pi, the python container requires privileged mode 
    # or --device /dev/bus/usb/ bindings for this to succeed.
    status = send(instructions=instructions, printer_identifier=PRINTER_PORT, backend_identifier='pyusb', blocking=True)
    return status
