import os
import dotenv
dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.deepeval import router as deepeval
from routers.deepeval_projects import router as deepeval_projects
from routers.evaluation_logs import router as evaluation_logs
from routers.deepeval_orgs import router as deepeval_orgs
from routers.deepeval_arena import router as deepeval_arena
from middlewares.middleware import TenantMiddleware
from database.redis import close_redis
from alembic.config import Config
from alembic import command

import logging
logger = logging.getLogger('uvicorn')

def run_migrations():
    logger.info("Running migrations...")
    try:
        import subprocess
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            logger.info("Migrations completed successfully")
        else:
            logger.warning(f"Migrations failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        logger.warning("Migrations timed out, continuing anyway")
    except Exception as e:
        logger.warning(f"Migrations skipped or failed: {e}")

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
app.include_router(deepeval_arena, prefix="/deepeval", tags=["DeepEval Arena"])
app.include_router(evaluation_logs, tags=["Evaluation Logs & Monitoring"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("LLM_EVALS_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
