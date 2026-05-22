from fastapi import FastAPI
from app.auth.router import router as auth_router
from app.friends.router import router as friends_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(friends_router)
