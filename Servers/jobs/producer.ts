export * from "../services/slack/slackProducer";
import { logFailure } from "../utils/logger/logHelper";

import { scheduleDailyNotification } from "../services/slack/slackProducer";
import logger from "../utils/logger/fileLogger";
import { scheduleVendorReviewDateNotification } from "../services/automations/automationProducer";

export async function addAllJobs(): Promise<void> {
  await scheduleDailyNotification();
  await scheduleVendorReviewDateNotification();
}

if (require.main === module) {
  addAllJobs()
    .then(() => {
      logger.info("Added All Jobs successfully!!");
      process.exit();
    })
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
