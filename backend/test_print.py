import requests

payload = {
    "printer_name": "Test",
    "customer_name": "Test",
    "workplace": "Test",
    "date": "Test",
    "file_path": None,
    "design": {},
    "tape_size": "62"
}

response = requests.post("http://localhost:8000/print", json=payload)
print(response.status_code)
print(response.text)
