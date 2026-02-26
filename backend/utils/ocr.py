import cv2
import pytesseract
import numpy as np
from PIL import Image, ImageOps
import io
from .extractor import extract_data_from_text
from typing import Dict, Optional

def extract_from_image(image_bytes: bytes) -> Dict[str, Optional[str]]:
    """
    Reads an image from bytes, processes it with OpenCV to enhance OCR accuracy, 
    and uses Tesseract OCR to read text. Then runs regex extraction.
    """
    # Read image with PIL to handle EXIF transpose (crucial for mobile photos which often save sideways)
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img)
        
        # Cap the maximum dimension to ~2048 to prevent massive 8MB+ mobile photos from choking Tesseract
        max_size = 2048
        if max(pil_img.width, pil_img.height) > max_size:
            pil_img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        # Convert PIL Image back to OpenCV format
        open_cv_image = np.array(pil_img) 
        # Convert RGB to BGR 
        img = open_cv_image[:, :, ::-1].copy() 
    except Exception as e:
        print(f"Error processing image with PIL: {e}")
        # Fallback to direct decode if PIL fails
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Upscale slightly only if the image is very small
    if img.shape[1] < 1000:
        scale = 2
        width = int(img.shape[1] * scale)
        height = int(img.shape[0] * scale)
        resized = cv2.resize(img, (width, height), interpolation=cv2.INTER_CUBIC)
    else:
        resized = img

    # Convert to grayscale
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    
    # Text extraction from camera photos is highly sensitive to layout modes (PSM).
    # PSM 4 is excellent at finding detached data like "FRDP22420" on pure PIL images.
    # PSM 6 is excellent at finding structured unified blocks like the Customer Name.
    # We will run both extremely quickly and combine the text into a single string for regex.
    
    try:
        text_psm4 = pytesseract.image_to_string(pil_img, config=r'--oem 3 --psm 4 -l deu')
    except Exception:
        text_psm4 = ""
        
    text_psm6 = pytesseract.image_to_string(gray, config=r'--oem 3 --psm 6 -l deu')
    
    combined_text = text_psm4 + "\n" + text_psm6
    
    # Pass combined string to regex parser
    return extract_data_from_text(combined_text)
