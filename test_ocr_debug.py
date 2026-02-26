import sys
import cv2
import pytesseract
import numpy as np
from PIL import Image, ImageOps
import io

def test_image(image_path):
    print(f"=== TESTING {image_path} ===")
    try:
        image_bytes = open(image_path, "rb").read()
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img)

        max_size = 2048
        if max(pil_img.width, pil_img.height) > max_size:
            pil_img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        open_cv_image = np.array(pil_img) 
        img = open_cv_image[:, :, ::-1].copy() 
        
        if img.shape[1] < 1000:
            scale = 2
            width = int(img.shape[1] * scale)
            height = int(img.shape[0] * scale)
            resized = cv2.resize(img, (width, height), interpolation=cv2.INTER_CUBIC)
        else:
            resized = img

        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        
        print("--- PSM 4 Output (PIL) ---")
        try:
            print(pytesseract.image_to_string(pil_img, config=r'--oem 3 --psm 4 -l deu'))
        except Exception as e:
            print(f"Failed: {e}")
            
        print("\n--- PSM 6 Output (Grayscale) ---")
        try:
            print(pytesseract.image_to_string(gray, config=r'--oem 3 --psm 6 -l deu'))
        except Exception as e:
            print(f"Failed: {e}")
    except Exception as e:
        print(f"Global error on file {image_path}: {e}")

test_image("/app/uploads/8b198e09-24d4-4d0a-96dd-14d131829970_camera_capture.jpg")
test_image("/app/uploads/b64c8da1-2c66-4478-b25e-b52f09c34975_camera_capture.jpg")
