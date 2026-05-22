from app.database import get_db
from app.models import Friendship, FriendshipStatus, User, Chat, ChatParticipant, ChatType
from app.auth.service import get_user_by_username
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

async def send_friend_request(db: AsyncSession, sender_id: int, target_username: str):
    target = await get_user_by_username(db, target_username)
    if not target:
        return None, "User not found"

    existing = await db.execute(
        select(Friendship).where(
            (Friendship.sender_id == sender_id) &
            (Friendship.receiver_id == target.id)
        )
    )
    if existing.scalar_one_or_none():
        return None, "Request already sent"

    req = Friendship(sender_id=sender_id, receiver_id=target.id)
    db.add(req)
    await db.commit()
    return req, None

async def accept_friend_request(db: AsyncSession, receiver_id: int, request_id: int):
    req = await db.get(Friendship, request_id)
    if not req or req.receiver_id != receiver_id or req.status != FriendshipStatus.pending:
        return None, "Invalid request"

    req.status = FriendshipStatus.accepted
    await db.commit()
    return req, None

async def get_friendships(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Friendship).where(
            (Friendship.sender_id == user_id) |
            (Friendship.receiver_id == user_id)
        ).order_by(Friendship.created_at.desc())
    )
    return result.scalars().all()

async def get_pending_requests(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Friendship).where(
            (Friendship.receiver_id == user_id) &
            (Friendship.status == FriendshipStatus.pending)
        )
    )
    return result.scalars().all()
