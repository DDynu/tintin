from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.friends.router import router as friends_router
from app.chats.router import router as chats_router
from app.chats.websocket import websocket_endpoint
from fastapi import WebSocket

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(friends_router)
app.include_router(chats_router)

@app.websocket("/ws")
async def ws(websocket: WebSocket, user_id: int):
    await websocket_endpoint(websocket, user_id)
