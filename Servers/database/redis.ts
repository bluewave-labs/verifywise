import IORedis from "ioredis";

const redisClient = new IORedis(process.env.REDIS_URL || "redis://localhost:6379/0", {
  maxRetriesPerRequest: null,
});

export default redisClient;
