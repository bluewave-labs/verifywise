import { Queue } from "bullmq";
import redisClient from "../../database/redis"

// Create a new queue (connected to Redis using environment variable)
export const automationQueue = new Queue("automation-actions", {
  connection: redisClient
});

export async function enqueueAutomationAction(
  actionKey: string, data: Object) {
  return automationQueue.add(actionKey, data);
}
