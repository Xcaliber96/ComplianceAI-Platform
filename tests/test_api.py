import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.api.main_api import app


# ✅ Fixture for async client
@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ✅ Tests
@pytest.mark.asyncio
async def test_root_online(client):
    response = await client.get("/")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_supplier(client):
    data = {
        "name": "Test Supplier",
        "email": "test@supplier.com",
        "industry": "Manufacturing",
        "region": "US",
        "user_uid": "testuser123",
    }
    response = await client.post("/api/suppliers", data=data)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Supplier"

@pytest.mark.asyncio
async def test_list_suppliers(client):
    response = await client.get("/api/suppliers", params={"user_uid": "testuser123"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_task(client):
    data = {
        "obligation_id": 1,
        "assigned_to": "Legal",
        "sla_due": "2025-12-01T00:00:00",
        "supplier_id": "1",
        "checklist_template": "{}",
        "user_uid": "testuser123",
    }
    response = await client.post("/api/task", data=data)
    assert response.status_code == 200
