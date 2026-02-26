import sys
import pdfplumber

pdf_path = "uploads/057f1503-a257-41f8-9c78-254351af4ae9_brnb4220024e1a6_017326.pdf"

full_text = ""
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        full_text += page.extract_text() + "\n"

from utils.extractor import extract_from_pdf, extract_data_from_text

print("Testing direct extractions...")
result = extract_from_pdf(pdf_path)

print("EXTRACTION RESULT:", result)
