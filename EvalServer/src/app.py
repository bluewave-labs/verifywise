import os
import dotenv
dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.deepeval import router as deepeval
from routers.deepeval_projects import router as deepeval_projects
from routers.evaluation_logs import router as evaluation_logs
from routers.deepeval_orgs import router as deepeval_orgs
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

@app.on_event("startup")
def startup_event():
    run_migrations()

@app.get("/")
def root():
    return {"message": "Welcome to the Eval Server!"}

app.include_router(deepeval, prefix="/deepeval", tags=["DeepEval"])
app.include_router(deepeval_projects, prefix="/deepeval", tags=["DeepEval Projects"])
app.include_router(deepeval_orgs, prefix="/deepeval", tags=["DeepEval Orgs"])
app.include_router(evaluation_logs, tags=["Evaluation Logs & Monitoring"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
