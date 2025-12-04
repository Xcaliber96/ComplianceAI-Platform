from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.main_api import run_compliance_payload

app = FastAPI()

@app.post("/test")
async def test(payload: dict):
    return await run_compliance_payload(payload)

client = TestClient(app)

def test_route():
    payload = {
        "user_uid": "123",
        "file_id": "456",
        "regulation_ids": ["AAA", "BBB"]
    }

    response = client.post("/test", json=payload)
    print("STATUS:", response.status_code)
    print("BODY:", response.json())

test_route()
