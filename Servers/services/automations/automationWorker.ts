import { Worker, Job } from "bullmq";
import redisClient from "../../database/redis"
import sendEmail from "./actions/sendEmail";
import { getTenantHash } from "../../tools/getTenantHash";
import { getAllOrganizationsQuery } from "../../utils/organization.utils";
import { getAllVendorsQuery } from "../../utils/vendor.utils";
import { sequelize } from "../../database/db";
import { TenantAutomationActionModel } from "../../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { buildVendorReplacements } from "../../utils/automation/vendor.automation.utils";
import { replaceTemplateVariables } from "../../utils/automation/automation.utils";
import { enqueueAutomationAction } from "./automationProducer";

const handlers = {
  "send_email": sendEmail,
};

async function sendVendorReviewDateNotification() {
  const organizations = await getAllOrganizationsQuery();
  for (let org of organizations) {
    const tenantHash = getTenantHash(org.id!);
    const vendors = await getAllVendorsQuery(tenantHash);
    const automations = await sequelize.query(`SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        a.params AS automation_params,
        aa.*
      FROM public.automation_triggers pat JOIN "${tenantHash}".automations a ON a.trigger_id = pat.id JOIN "${tenantHash}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'vendor_review_date_approaching' AND a.is_active ORDER BY aa."order" ASC;`) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string, automation_params: { daysBefore: number } })[], number];
    if (automations[0].length === 0) {
      continue;
    }
    const automation = automations[0][0];
    for (let vendor of vendors) {
      const automationParams = automation.automation_params || {};

      const notificationDate = new Date(vendor.review_date!);
      notificationDate.setDate(notificationDate.getDate() - (automationParams.daysBefore || 0));
      notificationDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (notificationDate.getDate() !== today.getDate()) {
        continue;
      }
      const params = automation.params!;

      // Calculate days until review
      const reviewDate = new Date(vendor.review_date!);
      const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Build replacements with review information
      const replacements = buildVendorReplacements(vendor);

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements)
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, processedParams);
    }
  }
}

export const createAutomationWorker = () => {
  const automationWorker = new Worker(
    'automation-actions',
    async (job: Job) => {
      const name = job.name;
      console.log(`Received job of type: ${name}`);
      if (name === "send_vendor_notification") {
        await sendVendorReviewDateNotification();
      } else {
        const handler = handlers[name as keyof typeof handlers];
        if (!handler) {
          throw new Error(`No handler found for action type: ${name}`);
        }
        await handler(job.data);
      }
    },
    { connection: redisClient, concurrency: 10 }
  );
  automationWorker.on('completed', (job) => {
    console.log(`Job ${job.id} of type ${job.name} has been completed`);
  });
  automationWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} of type ${job?.name} has failed with error: ${err.message}`);
  });
  return automationWorker;
}