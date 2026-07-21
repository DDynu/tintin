import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, get_engine, AsyncSessionLocal
from app.models import Base


@pytest_asyncio.fixture(scope="module")
async def client():
    await init_db()
    engine = get_engine()
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


@pytest.mark.asyncio
async def test_register_creates_self_chat(client):
    """Verify that registering a new user automatically creates a self chat."""
    r = await client.post("/auth/register", json={
        "username": "selfchatuser",
        "email": "selfchat@example.com",
        "password": "password123",
    })
    assert r.status_code == 200
    token = r.json()["access_token"]

    # Get self chat via API
    r = await client.get("/chats/self", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "self"
    assert data["name"] == "My Notes"
    assert len(data["participants"]) == 1
    assert data["participants"][0]["username"] == "selfchatuser"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Login with wrong password should return 401."""
    r = await client.post("/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpass",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    """Registering with an existing username should return 400."""
    await client.post("/auth/register", json={
        "username": "dupeuser",
        "email": "dupe1@example.com",
        "password": "password123",
    })
    r = await client.post("/auth/register", json={
        "username": "dupeuser",
        "email": "dupe2@example.com",
        "password": "password123",
    })
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Registering with an existing email should return 400."""
    await client.post("/auth/register", json={
        "username": "user1",
        "email": "dupe@example.com",
        "password": "password123",
    })
    r = await client.post("/auth/register", json={
        "username": "user2",
        "email": "dupe@example.com",
        "password": "password123",
    })
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_auth_required_for_chats(client):
    """Unauthenticated requests to /chats should return 401."""
    r = await client.get("/chats/")
    assert r.status_code == 401

    r = await client.post("/chats/", json={"name": "test", "participant_usernames": []})
    assert r.status_code == 401
