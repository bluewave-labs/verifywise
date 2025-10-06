export * from "../services/slack/slackProducer";
import { logFailure } from "../utils/logger/logHelper";

import { scheduleDailyNotification } from "../services/slack/slackProducer";

export async function addAllJobs(): Promise<void> {
  await scheduleDailyNotification();
}

if (require.main === module) {
  addAllJobs()
    .then(() => process.exit())
    .catch((error) => {
      logFailure({
        eventType: "Update",
        description: "Added Jobs to the Queue",
        functionName: "addAllJobs",
        fileName: "producer.ts",
        error: error,
      });
      process.exit(1);
    });
}
