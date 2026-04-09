import requests
import time

try:
    start = time.time()
    r = requests.post('http://127.0.0.1:5000/get_recommendations', json={'mood': 'happy'})
    end = time.time()
    print(f"Status: {r.status_code}")
    print(f"Success: {r.json().get('success')}")
    print(f"Time: {end-start}s")
except Exception as e:
    print(f"Error: {e}")
