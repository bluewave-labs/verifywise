import os
import aioredis
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis = None

async def get_redis():
    global redis
    if not redis:
        redis = await aioredis.from_url(REDIS_URL, decode_responses=True)
    return redis

async def close_redis():
    global redis
    if redis:
        await redis.close()
        redis = None

async def get_next_job_id():
    r = await get_redis()
    # Use Redis INCR to generate unique job IDs
    job_id = await r.incr("job_id_counter")
    return job_id

async def set_job_status(job_id: int, status: dict):
    r = await get_redis()
    # Store job status JSON serialized
    await r.set(f"job_status:{job_id}", json.dumps(status), ex=3600)

async def get_job_status(job_id: int):
    r = await get_redis()
    data = await r.get(f"job_status:{job_id}")
    if data:
        return json.loads(data)
    return None

async def delete_job_status(job_id: int):
    r = await get_redis()
    # Delete job status from Redis
    await r.delete(f"job_status:{job_id}")
    return True
