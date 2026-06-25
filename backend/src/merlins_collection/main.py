from fastapi import FastAPI

from merlins_collection.routers import auth, chat, inventory

app = FastAPI(title="Merlin's Collection API", version="0.1.0")
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(chat.router)
