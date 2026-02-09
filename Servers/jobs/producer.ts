export * from "../services/slack/slackProducer";

import { scheduleDailyNotification } from "../services/slack/slackProducer";
import logger from "../utils/logger/fileLogger";
import { scheduleReportNotification, scheduleVendorReviewDateNotification, schedulePMMHourlyCheck, scheduleShadowAiJobs } from "../services/automations/automationProducer";

export async function addAllJobs(): Promise<void> {
  await scheduleDailyNotification();
  await scheduleVendorReviewDateNotification();
  await scheduleReportNotification();
  await schedulePMMHourlyCheck();
  await scheduleShadowAiJobs();
}

if (require.main === module) {
  addAllJobs()
    .then(() => {
      logger.info("Added All Jobs successfully!!");
      process.exit();
    })
    .catch((_error) => {
      // logFailure({
      //   eventType: "Update",
      //   description: "Added Jobs to the Queue",
      //   functionName: "addAllJobs",
      //   fileName: "producer.ts",
      //   error: error,
      // });
      process.exit(1);
    });
}
