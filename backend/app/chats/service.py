from app.models import Chat, ChatParticipant, Message, MessageRead, User
from app.auth.service import get_user_by_username
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    # Eagerly load sender so msg.sender is available without a lazy query
    result = await db.execute(
        select(Message).where(Message.id == msg.id).options(selectinload(Message.sender))
    )
    return result.scalars().one()

async def get_chat_messages(db: AsyncSession, chat_id: int, limit: int = 50):
    result = await db.execute(
        select(Message).where(Message.chat_id == chat_id).options(selectinload(Message.sender)).order_by(desc(Message.created_at)).limit(limit)
    )
    return result.scalars().all()

async def mark_read(db: AsyncSession, message_id: int, reader_id: int):
    read = MessageRead(message_id=message_id, reader_id=reader_id)
    db.add(read)
    await db.commit()

async def get_chat_participants(db: AsyncSession, chat_id: int):
    result = await db.execute(
        select(ChatParticipant).where(ChatParticipant.chat_id == chat_id).options(selectinload(ChatParticipant.user))
    )
    return result.scalars().all()

async def update_chat_name(db: AsyncSession, chat_id: int, owner_id: int, new_name: str):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.owner_id == owner_id))
    chat = result.scalars().first()
    if not chat:
        return None
    chat.name = new_name
    await db.commit()
    await db.refresh(chat)
    return chat

async def add_participants(db: AsyncSession, chat_id: int, owner_id: int, usernames: list[str]):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.owner_id == owner_id))
    chat = result.scalars().first()
    if not chat:
        return None
    for username in usernames:
        user = await get_user_by_username(db, username)
        if user:
            existing = await db.execute(
                select(ChatParticipant).where(
                    ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user.id
                )
            )
            if not existing.scalars().first():
                db.add(ChatParticipant(chat_id=chat_id, user_id=user.id))
    await db.commit()
    return chat

async def remove_participant(db: AsyncSession, chat_id: int, owner_id: int, target_user_id: int):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.owner_id == owner_id))
    chat = result.scalars().first()
    if not chat:
        return None
    if chat.owner_id == target_user_id:
        return None
    result = await db.execute(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == target_user_id
        )
    )
    participant = result.scalars().first()
    if participant:
        await db.delete(participant)
        await db.commit()
    return chat

async def delete_chat(db: AsyncSession, chat_id: int, owner_id: int):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.owner_id == owner_id))
    chat = result.scalars().first()
    if not chat:
        return None

    # FK columns without ondelete=CASCADE can't be blanked by SQLAlchemy,
    # so delete dependent rows explicitly in FK-dependency order.
    await db.execute(
        MessageRead.__table__.delete().where(MessageRead.message_id.in_(
            select(Message.id).where(Message.chat_id == chat_id)
        ))
    )
    await db.execute(
        Message.__table__.delete().where(Message.chat_id == chat_id)
    )
    await db.execute(
        ChatParticipant.__table__.delete().where(ChatParticipant.chat_id == chat_id)
    )

    await db.delete(chat)
    await db.commit()
    return chat
