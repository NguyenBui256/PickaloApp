import requests
import sys

def test_login():
    url = "http://localhost:8088/api/v1/auth/login"
    payload = {
        "phone": "+84325575098",
        "password": "admin"
    }
    try:
        print(f"Testing login at {url}...")
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
