import sys
import cv2
import pytesseract
import numpy as np
from PIL import Image, ImageOps
import io

image_bytes = open("/app/uploads/f0449997-72cf-43f6-9fee-9c06296be09b_camera_capture.jpg", "rb").read()
pil_img = Image.open(io.BytesIO(image_bytes))
pil_img = ImageOps.exif_transpose(pil_img)
if max(pil_img.width, pil_img.height) > 2048:
    pil_img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
    
img = np.array(pil_img)[:, :, ::-1].copy()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

print("--- RAW GRAYSCALE ---")
print(pytesseract.image_to_string(gray, config='--oem 3 --psm 6 -l deu')[:500])

print("\n--- THRESH_BINARY ---")
_, thresh1 = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
print(pytesseract.image_to_string(thresh1, config='--oem 3 --psm 6 -l deu')[:500])

print("\n--- ADAPTIVE_THRESH_GAUSSIAN ---")
thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
print(pytesseract.image_to_string(thresh2, config='--oem 3 --psm 6 -l deu')[:500])
