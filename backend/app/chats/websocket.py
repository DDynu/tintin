from fastapi import WebSocket
from app.chats.service import send_message, mark_read
from app.database import AsyncSessionLocal
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.connections: dict[int, WebSocket] = {}
        self.chat_rooms: dict[int, set[int]] = defaultdict(set)

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws

    def disconnect(self, user_id: int):
        self.connections.pop(user_id, None)

    async def broadcast(self, chat_id: int, message: dict):
        for user_id in self.chat_rooms.get(chat_id, set()):
            ws = self.connections.get(user_id)
            if ws:
                await ws.send_json(message)

    async def join_chat(self, user_id: int, chat_id: int):
        self.chat_rooms[chat_id].add(user_id)

    async def leave_chat(self, user_id: int, chat_id: int):
        self.chat_rooms[chat_id].discard(user_id)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "join":
                await manager.join_chat(user_id, data["chat_id"])
            elif data["type"] == "message":
                async with AsyncSessionLocal() as db:
                    msg = await send_message(db, data["chat_id"], user_id, data["content"])
                    await manager.broadcast(data["chat_id"], {
                        "type": "message",
                        "message": msg,
                    })
            elif data["type"] == "read":
                async with AsyncSessionLocal() as db:
                    await mark_read(db, data["message_id"], user_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
