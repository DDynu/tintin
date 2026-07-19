from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import User
from app.auth.service import (
    verify_password, hash_password, create_access_token,
    get_user_by_username, get_user_by_email, get_current_user
)
from app.schemas import UserRegister, UserLogin, Token, UserOut
from sqlalchemy.orm import selectinload
from app.chats.service import create_self_chat

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_username(db, data.username):
        raise HTTPException(400, "Username taken")
    if await get_user_by_email(db, data.email):
        raise HTTPException(400, "Email taken")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-create self chat for new user
    await create_self_chat(db, user.id)

    return Token(access_token=create_access_token({"sub": str(user.id)}))

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    return Token(access_token=create_access_token({"sub": str(user.id)}))

@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user

@router.get("/users", response_model=list[UserOut])
async def search_users(
    q: str = Query("", alias="q"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filtered = select(User).where(User.id != current_user.id)
    if q.strip():
        pattern = f"%{q.strip()}%"
        filtered = filtered.where(
            or_(
                User.username.ilike(pattern),
            )
        )
    result = await db.execute(
        filtered.order_by(User.username).limit(20)
    )
    return result.scalars().all()
