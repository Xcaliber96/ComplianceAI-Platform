import pytest
from httpx import AsyncClient
from src.api.main_api import app
from src.api.db import SessionLocal
from src.api.models import Supplier, RemediationTask

@pytest.fixture(scope="module")
async def client():
    async with AsyncClient(app=app, base_url="http://testserver") as c:
        yield c

@pytest.mark.asyncio
async def test_root_online(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert "success" in response.text

@pytest.mark.asyncio
async def test_create_supplier(client):
    data = {
        "name": "Panasonic Holdings",
        "email": "test@panasonic.com",
        "industry": "Electronics",
        "region": "Japan",
        "user_uid": "fake-test-uid"
    }
    response = await client.post("/api/suppliers", data=data)
    assert response.status_code == 200
    supplier = response.json()
    assert supplier["name"] == "Panasonic Holdings"
    assert supplier["user_uid"] == "fake-test-uid"

@pytest.mark.asyncio
async def test_list_suppliers(client):
    response = await client.get("/api/suppliers", params={"user_uid": "fake-test-uid"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(s["name"] == "Panasonic Holdings" for s in data)

@pytest.mark.asyncio
async def test_create_task(client):
    # First, create an obligation
    obligation_data = {
        "description": "GDPR Compliance Review",
        "regulation": "GDPR",
        "due_date": "2025-12-31T00:00:00"
    }
    obl = await client.post("/api/obligation", data=obligation_data)
    assert obl.status_code == 200
    obl_id = obl.json()["id"]

    # Then create a task for it
    task_data = {
        "obligation_id": str(obl_id),
        "assigned_to": "compliance@company.com",
        "sla_due": "2025-11-30T00:00:00",
        "supplier_id": "1",
        "user_uid": "fake-test-uid"
    }
    task = await client.post("/api/task", data=task_data)
    assert task.status_code == 200
    task_json = task.json()
    assert task_json["assigned_to"] == "compliance@company.com"
    assert task_json["user_uid"] == "fake-test-uid"
