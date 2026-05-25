from app.models import Chat, ChatParticipant, Message, MessageRead, User
from app.auth.service import get_user_by_username
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

async def create_chat(db: AsyncSession, owner_id: int, type: str, name: str | None, participant_usernames: list[str]):
    chat = Chat(type=type, name=name, owner_id=owner_id)
    db.add(chat)
    await db.flush()

    participants = [ChatParticipant(chat_id=chat.id, user_id=owner_id)]
    for username in participant_usernames:
        user = await get_user_by_username(db, username)
        if user:
            participants.append(ChatParticipant(chat_id=chat.id, user_id=user.id))

    db.add_all(participants)
    await db.commit()
    await db.refresh(chat)
    return chat

async def get_user_chats(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Chat).join(ChatParticipant).where(
            ChatParticipant.user_id == user_id
        ).order_by(desc(Chat.created_at))
    )
    return result.scalars().all()

async def send_message(db: AsyncSession, chat_id: int, sender_id: int, content: str):
    msg = Message(chat_id=chat_id, sender_id=sender_id, content=content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

async def get_chat_messages(db: AsyncSession, chat_id: int, limit: int = 50):
    result = await db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(desc(Message.created_at)).limit(limit)
    )
    return result.scalars().all()

async def mark_read(db: AsyncSession, message_id: int, reader_id: int):
    read = MessageRead(message_id=message_id, reader_id=reader_id)
    db.add(read)
    await db.commit()
