import requests

def test_venues():
    url = "http://localhost:8088/api/v1/venues"
    try:
        print(f"Testing venues at {url}...")
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        else:
            print(f"Found {len(response.json().get('items', []))} venues")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_venues()
