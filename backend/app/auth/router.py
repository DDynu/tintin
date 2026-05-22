from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.auth.service import (
    verify_password, hash_password, create_access_token,
    get_user_by_username, get_user_by_email, get_current_user
)
from app.schemas import UserRegister, UserLogin, Token, UserOut
from sqlalchemy import select

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
