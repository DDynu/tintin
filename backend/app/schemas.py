from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from typing import Literal

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class FriendshipCreate(BaseModel):
    target_username: str

class FriendshipOut(BaseModel):
    id: int
    sender: UserOut
    receiver: UserOut
    status: str
    created_at: datetime

class ChatCreate(BaseModel):
    type: str
    name: Optional[str] = None
    participant_usernames: List[str] = []

class ChatOut(BaseModel):
    id: int
    type: str
    name: Optional[str]
    last_message: str | None = None
    owner_id: int
    created_at: datetime
    participants: List[UserOut] = []

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    sender: UserOut
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatNameUpdate(BaseModel):
    name: str

class ChatParticipantsUpdate(BaseModel):
    usernames: List[str]
