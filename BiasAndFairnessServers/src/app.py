import os
import dotenv
dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.bias_and_fairness import router as bias_and_fairness
from middlewares.middleware import TenantMiddleware
from database.redis import close_redis
from alembic.config import Config
from alembic import command

import logging
logger = logging.getLogger('uvicorn')

def run_migrations():
    logger.info("Running migrations...")
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
    except Exception as e:
        logger.info(f"Error running migrations: {e}")

async def shutdown_redis():
    await close_redis()

app = FastAPI(on_shutdown=[shutdown_redis])

# enable CORS
origins = [os.environ.get("BACKEND_URL") or "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

@app.get("/")
def root():
    return {"message": "Welcome to the Bias and Fairness Server!"}

app.include_router(bias_and_fairness, prefix="/bias_and_fairness", tags=["Bias and Fairness"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
