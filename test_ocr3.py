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

print("--- RAW GRAYSCALE (No Thresholding, psm 4) ---")
custom_config = r'--oem 3 --psm 4 -l deu'
print(pytesseract.image_to_string(gray, config=custom_config))

print("--- RAW GRAYSCALE (No Thresholding, psm 6) ---")
custom_config = r'--oem 3 --psm 6 -l deu'
print(pytesseract.image_to_string(gray, config=custom_config))

print("--- PURE PIL IMAGE (psm 4) ---")
print(pytesseract.image_to_string(pil_img, config='--oem 3 --psm 4 -l deu'))

print("--- CLAHE ONLY (psm 4) ---")
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
clahe_gray = clahe.apply(gray)
print(pytesseract.image_to_string(clahe_gray, config='--oem 3 --psm 4 -l deu'))
