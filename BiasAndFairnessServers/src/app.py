import os
import dotenv
dotenv.load_dotenv()

import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routers.bias_and_fairness import router as bias_and_fairness
from alembic.config import Config
from alembic import command

log = logging.getLogger("uvicorn")

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

@asynccontextmanager
async def lifespan(app_: FastAPI):
    log.info("Starting up...")
    log.info("run alembic upgrade head...")
    run_migrations()
    yield
    log.info("Shutting down...")


app = FastAPI(lifespan=lifespan)

# enable CORS
origins = [os.environ.get("BACKEND_URL")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the Bias and Fairness Server!"}

app.include_router(bias_and_fairness, prefix="/bias_and_fairness", tags=["Bias and Fairness"])
