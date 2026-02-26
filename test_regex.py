import re

text = "\\vK P83086-009-7\\n88046 FRIEDRICHSHAF\\n1 EB26016735"
clean_text = text.replace('\\n', ' ')

print(f"Clean text: {repr(clean_text)}")

extracted = {"workplace": None}

workplace_pattern = re.compile(r'([WwVvKk]?[\s]*[Kk][\sA-Z]*[893]086[\d\-\s]*)', re.IGNORECASE)
wp_match = workplace_pattern.search(clean_text)
if wp_match:
    raw_wp = wp_match.group(1).strip()
    raw_wp = re.sub(r'(?<=\d)\s+(?=\d)', '', raw_wp)
    raw_wp = re.split(r'\s+FRDP|\s+C\.|\s+-?NNER|\s+DENNER|\s+N0P|\s+EB', raw_wp, flags=re.IGNORECASE)[0]
    raw_wp = raw_wp.replace(' ', '').upper()
    
    if '89086' in raw_wp:
        raw_wp = 'WKP89086' + raw_wp.split('89086')[-1]
    elif '83086' in raw_wp:
        raw_wp = 'WKP83086' + raw_wp.split('83086')[-1]
        
    if not raw_wp.startswith('W'):
        raw_wp = 'W' + raw_wp
        
    extracted["workplace"] = raw_wp
    print(f"Matched workplace: {raw_wp}")
else:
    print("NO MATCH FOR WORKPLACE")
