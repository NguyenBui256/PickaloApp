
import requests
import json

def test_nearby():
    url = "http://localhost:8088/api/v1/matches/nearby"
    params = {
        "lat": 20.9845,
        "lng": 105.7925,
        "radius": 10000
    }
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data:
                print("First Match Sample:")
                print(json.dumps(data[0], indent=2, ensure_ascii=False))
            else:
                print("No matches found in radius.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_nearby()
