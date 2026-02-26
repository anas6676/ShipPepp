import sys
import cv2
import pytesseract
import numpy as np
from PIL import Image, ImageOps
import io

image_bytes = open("/app/uploads/8438b806-a7d8-4a59-94f7-1c0e502dfddd_camera_capture.jpg", "rb").read()
pil_img = Image.open(io.BytesIO(image_bytes))
pil_img = ImageOps.exif_transpose(pil_img)

max_size = 2048
if max(pil_img.width, pil_img.height) > max_size:
    pil_img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    
img = np.array(pil_img)[:, :, ::-1].copy()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
gray = clahe.apply(gray)

blur = cv2.GaussianBlur(gray, (3,3), 0)
thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5)

print("--- THRESH (used by app) ---")
custom_config = r'--oem 3 --psm 4 -l deu'
print(pytesseract.image_to_string(thresh, config=custom_config))

