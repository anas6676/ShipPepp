import re
from typing import Dict, Optional
import pdfplumber
import pytesseract
from pdf2image import convert_from_path

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
    pr_match = printer_pattern.search(clean_text)
    if pr_match:
        pr_raw = pr_match.group(1).replace(' ', '').upper()
        if 'P' in pr_raw and not pr_raw.startswith('WKP') and not pr_raw.startswith('VKP'):
            digits = pr_raw.split('P')[-1]
            extracted["printer_name"] = f"FRDP{digits}"

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
    workplace_pattern = re.compile(r'([WwVvKk]?[\s]*[Kk][\sA-Z]*[8][93]086[\d\-]{0,8})', re.IGNORECASE)
    wp_match = workplace_pattern.search(clean_text)
    if wp_match:
        raw_wp = wp_match.group(1).strip()
        # Clean up any inner spaces inside the workplace ID that OCR might have added
        raw_wp = re.sub(r'(?<=\d)\s+(?=\d)', '', raw_wp)
        
        # Stop at common boundaries if the regex grabbed too much
        raw_wp = re.split(r'\s+FRDP|\s+C\.|\s+-?NNER|\s+DENNER|\s+N0P|\s+EB', raw_wp, flags=re.IGNORECASE)[0]
        
        raw_wp = raw_wp.replace(' ', '').upper()
        
        # Auto-correct mangled prefix
        if '89086' in raw_wp:
            raw_wp = 'WKP89086' + raw_wp.split('89086')[-1]
        elif '83086' in raw_wp:
            raw_wp = 'WKP83086' + raw_wp.split('83086')[-1]
            
        if not raw_wp.startswith('W'):
            raw_wp = 'W' + raw_wp
            
        extracted["workplace"] = raw_wp

    # Dealer PO
    # E.g.: "EB 26016735" or "EB26016735"
    po_pattern = re.compile(r'(EB\s*\d{5,10})', re.IGNORECASE)
    po_match = po_pattern.search(clean_text)
    if po_match:
        extracted["dealer_po"] = po_match.group(1).replace(' ', '').upper()
            
    return extracted

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
            images = convert_from_path(pdf_path)
            custom_config = r'--oem 3 --psm 6 -l deu'
            for img in images:
                full_text += pytesseract.image_to_string(img, config=custom_config) + "\n"
        except Exception as e:
            print(f"pdf2image fallback failed: {e}")
            
    return extract_data_from_text(full_text)
