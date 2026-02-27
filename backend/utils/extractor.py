import re
import io
from typing import Dict, Optional
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image, ImageOps
import numpy as np

def extract_data_from_text(text: str) -> Dict[str, Optional[str]]:
    """
    Extracts Printer Name, Customer Name, and Workplace from the parsed text.
    """
    extracted = {
        "printer_name": None,
        "customer_name": None,
        "workplace": None,
        "dealer_po": None
    }
    
    # Clean text to remove some common OCR noise like weird line breaks before running global searches
    clean_text = text.replace('\n', ' ')

    # Try to find Printer Name (e.g. FRDP22420)
    # Exclude WKP/VKP so it doesn't accidentally grab the Workplace ID
    printer_pattern = re.compile(r'(?<!W)(?<!V)(?<!K)([A-Z0-9]{1,4}P[\s]*\d{4,5})', re.IGNORECASE)
    for pr_match in printer_pattern.finditer(clean_text):
        pr_raw = pr_match.group(1).replace(' ', '').upper()
        if 'P' in pr_raw and not pr_raw.startswith('WKP') and not pr_raw.startswith('VKP'):
            digits = pr_raw.split('P')[-1]
            extracted["printer_name"] = f"FRDP{digits}"
            break

    # Try to find Customer Name (e.g. C. DENNER (Z0054521))
    # Fast path: If we see DENNER, auto-correct entirely based on user request
    if 'DENNER' in clean_text.upper() or 'ENNER' in clean_text.upper():
        extracted["customer_name"] = "C. DENNER (Z0054521)"
    else:
        # Require a valid opening parenthesis or '1Z'/'12' to prevent grabbing random numbers
        cust_pattern = re.compile(r'([A-Z][A-Z\.\s\-]{2,})[\(\[]?\s*([Zz2][0-9]{6,8})[\)\]]?', re.IGNORECASE)
        cust_match = cust_pattern.search(clean_text)
        if cust_match:
            name_part = cust_match.group(1).strip()
            id_part = cust_match.group(2).replace(' ', '').upper()
            
            # OCR frequently misreads 'Z' as '2'
            if id_part.startswith('2'):
                id_part = 'Z' + id_part[1:]
                
            extracted["customer_name"] = f"{name_part} ({id_part})"

    # Workplace Location
    # The ID is always structured as: WKP89086-NNN-NNN[-F00-XXX]
    # OCR frequently mangles the prefix and the '89086' digit cluster.
    # Strategy 1: find the digit cluster directly (works when pdfplumber gave clean text or OCR was good)
    wp_found = None
    exact_pattern = re.compile(r'[A-Z0-9]{2,4}[\s]*[8B][93][0O]8[6G][\w\-\.]{4,25}', re.IGNORECASE)
    for m in exact_pattern.finditer(clean_text):
        raw = m.group(0).replace(' ', '').upper()
        # Extract everything after the 5-digit cluster (includes alphanumeric suffixes like -F05-OST)
        suffix_match = re.search(r'\d{4,5}([\-\w]+)', raw)
        suffix = suffix_match.group(1) if suffix_match else ''
        # Trim any trailing junk that is clearly not part of the ID (e.g. part of next field)
        suffix = re.sub(r'[^A-Z0-9\-].*$', '', suffix)
        wp_found = 'WKP89086' + suffix
        break

    # Strategy 2: anchor on the reliable -NNN-NNN numeric suffix, then grab more segments
    if not wp_found:
        loose_pattern = re.compile(
            r'[A-Z0-9\[\]\(\)\\|]{2,5}[\s]*[A-Z0-9\[\]\(\)\\|]{2,5}[\s]*'  # mangled prefix
            r'[\w\s\.]{1,10}'                                                 # mangled digit cluster
            r'(\-\d{3}\-\d{3}(?:[\-\.][A-Z0-9]{2,4})*)',                    # -001-100 + optional -F05-OST
            re.IGNORECASE
        )
        m2 = loose_pattern.search(clean_text)
        if m2:
            suffix = m2.group(1).replace('.', '-').upper()
            wp_found = 'WKP89086' + suffix

    if wp_found:
        extracted["workplace"] = wp_found



    # Dealer PO
    # E.g.: "EB 26016735" or "EB26016735"
    po_pattern = re.compile(r'(EB\s*\d{5,10})', re.IGNORECASE)
    po_match = po_pattern.search(clean_text)
    if po_match:
        extracted["dealer_po"] = po_match.group(1).replace(' ', '').upper()
            
    return extracted


def _preprocess_for_ocr(pil_img: Image.Image) -> Image.Image:
    """
    Fast preprocessing pipeline optimised for phone photos:
      1. Correct EXIF rotation
      2. Grayscale
      3. Cap to 1200px max (keeps OCR under ~10s even on a low-spec server)
      4. Otsu threshold (fast single-pass binarisation, good for printed labels)
    """
    import cv2

    # 1 – EXIF rotation
    pil_img = ImageOps.exif_transpose(pil_img)

    # 2 – Ensure RGB → grey
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    gray = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)

    h, w = gray.shape[:2]
    print(f"Image size before scaling: {w}x{h}")

    # 3 – Cap to 1200px max (4K images would take minutes through Tesseract)
    max_dim = 1200
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = gray.shape[:2]
        print(f"Downscaled to: {w}x{h}")

    # Upscale if tiny (Tesseract needs enough pixels to read characters)
    if max(h, w) < 800:
        scale = 800 / max(h, w)
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    # 4 – Otsu binarisation (fast, handles most printed-label contrast levels)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return Image.fromarray(thresh)


def extract_from_image(image_bytes: bytes) -> Dict[str, Optional[str]]:
    """
    Runs OCR *directly* on the original image bytes – no PDF round-trip.
    Uses PSM 6 (assume uniform block of text) which is fast and reliable for labels.
    """
    pil_img = Image.open(io.BytesIO(image_bytes))
    processed = _preprocess_for_ocr(pil_img)

    cfg = "--oem 3 --psm 6 -l deu"
    try:
        full_text = pytesseract.image_to_string(processed, config=cfg)
    except Exception as e:
        print(f"OCR failed: {e}")
        full_text = ""

    print(f"CAMERA OCR RAW TEXT:\n{full_text}")
    return extract_data_from_text(full_text)


def extract_from_pdf(pdf_path: str) -> Dict[str, Optional[str]]:
    """Reads PDF and extracts fields from text"""
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    if not full_text.strip():
        print("Fallback to OCR for PDF...")
        try:
            # Use a high DPI so the images rendered from PDF are crisp
            images = convert_from_path(pdf_path, dpi=300)
            for img in images:
                processed = _preprocess_for_ocr(img)
                for psm in (6, 4):
                    cfg = f"--oem 3 --psm {psm} -l deu"
                    try:
                        full_text += pytesseract.image_to_string(processed, config=cfg) + "\n"
                    except Exception as e:
                        print(f"PDF OCR psm={psm} failed: {e}")
        except Exception as e:
            print(f"pdf2image fallback failed: {e}")

    return extract_data_from_text(full_text)
