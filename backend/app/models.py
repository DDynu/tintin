from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship, DeclarativeBase
import enum
import datetime

class Base(DeclarativeBase):
    pass

class FriendshipStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    blocked = "blocked"

class ChatType(str, enum.Enum):
    dm = "dm"
    group = "group"

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sent_friendships = relationship("Friendship", foreign_keys="Friendship.sender_id", back_populates="sender")
    received_friendships = relationship("Friendship", foreign_keys="Friendship.receiver_id", back_populates="receiver")
    chats = relationship("Chat", back_populates="owner")
    messages = relationship("Message", back_populates="sender")
    read_receipts = relationship("MessageRead", back_populates="reader")

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(BigInteger, primary_key=True)
    sender_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(FriendshipStatus), default=FriendshipStatus.pending)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_friendships")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_friendships")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(BigInteger, primary_key=True)
    type = Column(Enum(ChatType), nullable=False)
    name = Column(String(100), nullable=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="chats")
    participants = relationship("ChatParticipant", back_populates="chat")
    messages = relationship("Message", back_populates="chat")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    chat_id = Column(BigInteger, ForeignKey("chats.id"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)

    chat = relationship("Chat", back_populates="participants")
    user = relationship("User")

class Message(Base):
    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True)
    chat_id = Column(BigInteger, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="messages")

class MessageRead(Base):
    __tablename__ = "message_reads"

    message_id = Column(BigInteger, ForeignKey("messages.id"), primary_key=True)
    reader_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    read_at = Column(DateTime, default=datetime.datetime.utcnow)

    message = relationship("Message", back_populates="read_receipts")
    reader = relationship("User", back_populates="read_receipts")
