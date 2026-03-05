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
from routers.bias_audits import router as bias_audits
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

async def cleanup_orphaned_experiments():
    """Mark any experiments stuck in 'running' as failed on server restart."""
    from database.db import get_db
    from sqlalchemy import text
    try:
        async with get_db() as db:
            result = await db.execute(text(
                "SELECT schema_name FROM information_schema.schemata "
                "WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')"
            ))
            schemas = [row[0] for row in result.fetchall()]
            for schema in schemas:
                try:
                    res = await db.execute(text(
                        f'UPDATE "{schema}".llm_evals_experiments '
                        f"SET status = 'failed', error_message = 'Server restarted during execution', "
                        f"completed_at = NOW() WHERE status = 'running'"
                    ))
                    if res.rowcount > 0:
                        logger.info(f"Marked {res.rowcount} orphaned experiment(s) as failed in schema '{schema}'")
                except Exception:
                    pass
            await db.commit()
    except Exception as e:
        logger.warning(f"Orphaned experiment cleanup skipped: {e}")

@app.on_event("startup")
async def startup_event():
    run_migrations()
    await cleanup_orphaned_experiments()

@app.get("/")
def root():
    return {"message": "Welcome to the Eval Server!"}

app.include_router(deepeval, prefix="/deepeval", tags=["DeepEval"])
app.include_router(deepeval_projects, prefix="/deepeval", tags=["DeepEval Projects"])
app.include_router(deepeval_orgs, prefix="/deepeval", tags=["DeepEval Orgs"])
app.include_router(deepeval_arena, prefix="/deepeval", tags=["DeepEval Arena"])
app.include_router(bias_audits, prefix="/deepeval", tags=["Bias Audits"])
app.include_router(evaluation_logs, tags=["Evaluation Logs & Monitoring"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("LLM_EVALS_PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
