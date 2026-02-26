import sys
from pdf2image import convert_from_path
import pytesseract

pdf_path = "uploads/f8190386-6bdc-4469-badc-28cce98d12b3_brnb4220024e1a6_017326.pdf"
images = convert_from_path(pdf_path)

full_text = ""
custom_config = r'--oem 3 --psm 6 -l deu'

for img in images:
    text = pytesseract.image_to_string(img, config=custom_config)
    full_text += text + "\n"

print("OCR PDF TEXT START ==================")
print(full_text)
print("OCR PDF TEXT END ====================")

from utils.extractor import extract_data_from_text
print("EXTRACTION RESULT:", extract_data_from_text(full_text))
