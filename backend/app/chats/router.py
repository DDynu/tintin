from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.chats.service import create_chat, get_user_chats, send_message, get_chat_messages
from app.schemas import ChatCreate, ChatOut, MessageCreate, MessageOut
from app.auth.service import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])

@router.post("/", response_model=ChatOut)
async def create(data: ChatCreate, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await create_chat(db, user_id, data.type, data.name, data.participant_usernames)

@router.get("/", response_model=list[ChatOut])
async def list_chats(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await get_user_chats(db, user_id)

@router.get("/{chat_id}/messages")
async def get_messages(chat_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await get_chat_messages(db, chat_id)

@router.post("/{chat_id}/messages")
async def post_message(chat_id: int, data: MessageCreate, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    return await send_message(db, chat_id, user_id, data.content)
