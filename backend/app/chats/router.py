from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.chats.service import create_chat, get_user_chats, send_message, get_chat_messages, get_chat_participants, update_chat_name, add_participants, remove_participant, delete_chat, ensure_self_chat, clear_chat_messages
from app.chats.websocket import manager
from app.schemas import ChatCreate, ChatOut, MessageCreate, MessageOut, ChatNameUpdate, ChatParticipantsUpdate, UserOut
from pydantic import TypeAdapter
from app.auth.service import get_current_user
from app.models import User

router = APIRouter(prefix="/chats", tags=["chats"])

@router.post("/", response_model=ChatOut)
async def create(data: ChatCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await create_chat(db, user.id, data.name, data.participant_usernames)
    data_out = TypeAdapter(ChatOut).dump_python(chat)
    participants = await get_chat_participants(db, chat.id)
    data_out["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
    return data_out

@router.get("/", response_model=list[ChatOut])
async def list_chats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Ensure self chat exists before listing
    await ensure_self_chat(db, user.id)
    chats = await get_user_chats(db, user.id)
    enriched = []
    for chat in chats:
        data = TypeAdapter(ChatOut).dump_python(chat)
        participants = await get_chat_participants(db, chat.id)
        data["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
        enriched.append(data)
    return enriched

@router.get("/self", response_model=ChatOut)
async def get_self_chat(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await ensure_self_chat(db, user.id)
    data_out = TypeAdapter(ChatOut).dump_python(chat)
    participants = await get_chat_participants(db, chat.id)
    data_out["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
    return data_out

@router.get("/{chat_id}/messages")
async def get_messages(chat_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    msgs = await get_chat_messages(db, chat_id)
    return TypeAdapter(list[MessageOut]).dump_python(msgs)

@router.post("/{chat_id}/messages")
async def post_message(chat_id: int, data: MessageCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    msg = await send_message(db, chat_id, user.id, data.content)
    # Broadcast via WebSocket so connected clients see the message in real-time
    # This prevents stale state if the API is ever used to send messages instead of WS
    await manager.broadcast(chat_id, {
        "type": "message",
        "message": {
            "id": msg.id,
            "sender": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            },
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        },
    })
    return TypeAdapter(MessageOut).dump_python(msg)

@router.delete("/{chat_id}/messages", status_code=204)
async def clear_messages(chat_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await clear_chat_messages(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    return None

@router.get("/{chat_id}/participants", response_model=list[UserOut])
async def get_participants(chat_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    participants = await get_chat_participants(db, chat_id)
    return TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])

@router.patch("/{chat_id}/name", response_model=ChatOut)
async def update_name(chat_id: int, data: ChatNameUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await update_chat_name(db, chat_id, user.id, data.name)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    data_out = TypeAdapter(ChatOut).dump_python(chat)
    participants = await get_chat_participants(db, chat.id)
    data_out["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
    return data_out

@router.post("/{chat_id}/participants/add", response_model=ChatOut)
async def add_part(chat_id: int, data: ChatParticipantsUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await add_participants(db, chat_id, user.id, data.usernames)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    data_out = TypeAdapter(ChatOut).dump_python(chat)
    participants = await get_chat_participants(db, chat.id)
    data_out["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
    added_users = [{"id": p.user.id, "username": p.user.username, "email": p.user.email, "created_at": p.user.created_at.isoformat()} for p in participants]
    await manager.broadcast_to_chat(chat_id, {
        "type": "participant_added",
        "chat_id": chat_id,
        "added_users": added_users,
    })
    # Send join instruction to each newly added user
    from app.auth.service import get_user_by_username
    for username in data.usernames:
        new_user = await get_user_by_username(db, username)
        if new_user:
            await manager.send_to_user(new_user.id, {
                "type": "join_chat",
                "chat_id": chat_id,
            })
    return data_out

@router.delete("/{chat_id}/participants/{user_id}", response_model=ChatOut)
async def remove_part(chat_id: int, user_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await remove_participant(db, chat_id, user.id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    data_out = TypeAdapter(ChatOut).dump_python(chat)
    participants = await get_chat_participants(db, chat.id)
    data_out["participants"] = TypeAdapter(list[UserOut]).dump_python([p.user for p in participants])
    await manager.broadcast_to_chat(chat_id, {
        "type": "participant_removed",
        "chat_id": chat_id,
        "removed_user_id": user_id,
    })
    return data_out

@router.delete("/{chat_id}", status_code=204)
async def delete_chat_endpoint(chat_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await delete_chat(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    # Notify remaining participants that the chat has been deleted
    await manager.broadcast_to_chat(chat_id, {
        "type": "chat_deleted",
        "chat_id": chat_id,
    })
    return None
