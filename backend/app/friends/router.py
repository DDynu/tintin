from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, get_db
from app.friends.service import (
    accept_friend_request,
    get_friendships,
    get_pending_requests,
    send_friend_request,
)
from app.models import User
from app.schemas import FriendshipCreate, FriendshipOut
from app.config import settings
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(401, "Invalid token")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user

router = APIRouter(prefix="/friends", tags=["friends"])

@router.post("/request", response_model=FriendshipOut)
async def create_request(data: FriendshipCreate, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    req, err = await send_friend_request(db, user_id, data.target_username)
    if err:
        raise HTTPException(400, err)
    return req

@router.post("/request/{request_id}/accept")
async def accept_request(request_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    req, err = await accept_friend_request(db, user_id, request_id)
    if err:
        raise HTTPException(400, err)
    return {"status": "accepted"}

@router.get("/")
async def list_friendships(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await get_friendships(db, user_id)

@router.get("/pending")
async def get_pending(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await get_pending_requests(db, user_id)
