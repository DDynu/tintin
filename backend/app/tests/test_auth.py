import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, AsyncSessionLocal
from app.models import Base

@pytest.fixture(scope="module")
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_register(client):
    r = await client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_login(client):
    await client.post("/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password123",
    })
    r = await client.post("/auth/login", json={
        "username": "loginuser",
        "password": "password123",
    })
    assert r.status_code == 200
