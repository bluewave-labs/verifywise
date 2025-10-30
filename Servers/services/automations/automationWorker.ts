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
import { getFormattedReportName, getReportData } from "../reportService";
import { marked } from "marked";
import { uploadFile } from "../../utils/fileUpload.utils";
import { mapReportTypeToFileSource } from "../../controllers/reporting.ctrl";
import { buildReportingReplacements } from "../../utils/automation/reporting.automation.utils";
const htmlDocx = require("html-to-docx-lite");

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

async function uploadReport(
  markdownData: string,
  reportType: string,
  userId: number,
  projectId: number,
  tenantId: string
) {
  const markdownDoc = await marked.parse(markdownData); // markdown file
  const generatedDoc = await htmlDocx(markdownDoc); // convert markdown to docx

  let defaultFileName = getFormattedReportName("", reportType);
  const docFile = {
    originalname: `${defaultFileName}.docx`,
    buffer: generatedDoc,
    fieldname: "file",
    mimetype:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  let uploadedFile;
  try {
    uploadedFile = await uploadFile(
      docFile,
      userId,
      projectId,
      mapReportTypeToFileSource(reportType),
      tenantId
    );
    return uploadedFile;
  } catch (error) {
    console.error("File upload error:", error);
    return undefined
  }
}

async function sendReportNotification() {
  const organizations = await getAllOrganizationsQuery();
  for (let org of organizations) {
    const tenantHash = getTenantHash(org.id!);
    const automations = await sequelize.query(`SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        a.params AS automation_params,
        a.created_by AS user_id,
        aa.*
      FROM public.automation_triggers pat JOIN "${tenantHash}".automations a ON a.trigger_id = pat.id JOIN "${tenantHash}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'scheduled_report' AND a.is_active ORDER BY aa."order" ASC;`) as [(TenantAutomationActionModel & {
      trigger_key: string, action_key: string, automation_params: {
        projectId: string, reportType: string[], frequency: string, hour?: number, minute?: number, dayOfWeek?: number, dayOfMonth?: number
      }, user_id: number
    })[], number];
    if (automations[0].length === 0) {
      continue;
    }
    for (let automation of automations[0]) {
      const params = automation.automation_params || {};
      const today = new Date();
      const frequency = params.frequency || 'daily';

      const projectDetails = await sequelize.query(
        `SELECT
          p.project_title AS project_title,
          p.owner AS owner,
          pf.framework_id AS framework_id,
          pf.id AS project_framework_id
        FROM "${tenantHash}".projects AS p INNER JOIN "${tenantHash}".projects_frameworks AS pf ON p.id = pf.project_id WHERE p.id = :projectId;`,
        {
          replacements: { projectId: parseInt(params.projectId) },
        }
      ) as [{ project_title: string, owner: number, framework_id: number, project_framework_id: number }[], number];
      const [[{ full_name }]] = await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :userId;`,
        {
          replacements: { userId: projectDetails[0][0].owner },
        }
      ) as [{ full_name: string }[], number];
      const [[{ organization_name }]] = await sequelize.query(
        `SELECT name FROM public.organizations WHERE id = :orgId;`,
        {
          replacements: { orgId: org.id },
        }
      ) as [{ organization_name: string }[], number];

      if (frequency === 'daily') {
        await enqueueAutomationAction("send_report_notification_daily", {
          automation,
          tenantHash,
          organization_id: org.id,
          projectDetails: projectDetails[0][0],
          full_name,
          organization_name
        }, {
          runAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), params.hour || 0, params.minute || 0, 0, 0),
          removeOnComplete: true,
          removeOnFail: false,
        });
        continue;
      } else if (frequency === 'monthly') {
        const currentMonth = today.getMonth();
        // if (currentMonth === 1 && params.dayOfMonth! > 28 && today.getDate() === 28) {
        // }
        if (today.getMonth() !== params.dayOfMonth! - 1) {
          continue;
        }
      } else if (frequency === 'weekly') {
        if (today.getDay() !== params.dayOfWeek) {
          continue;
        }
      }
      await sendReportNotificationEmail({ automation, tenantHash, organization_id: org.id, projectDetails: projectDetails[0][0], full_name, organization_name });
    }
  }
}

async function sendReportNotificationEmail(jobData: any) {
  const { automation, tenantHash, organization_id, projectDetails, full_name, organization_name } = jobData;
  const [[{ exists }]] = await sequelize.query(
    `SELECT EXISTS(SELECT 1 FROM "${tenantHash}".automation_actions WHERE id = :actionId) AS exists;`,
    {
      replacements: { actionId: parseInt(automation.id) },
    }
  ) as [{ exists: boolean }[], number];
  if (!exists) {
    console.log(`Automation action with ID ${automation.id} does not exist. Skipping job.`);
    return;
  }
  const automation_params = automation.automation_params || {};
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

  for (let reportType of automation_params.reportType) {
    const markdownData = await getReportData(
      parseInt(automation_params.projectId),
      projectDetails.framework_id,
      reportType,
      {
        projectTitle: projectDetails.project_title,
        projectOwner: full_name,
        organizationName: organization_name
      },
      projectDetails.project_framework_id,
      tenantHash
    )
    const uploadedFile = await uploadReport(markdownData, reportType, automation.user_id, parseInt(automation_params.projectId), tenantHash);

    // Add report file as email attachment
    if (uploadedFile) {
      attachments.push({
        filename: uploadedFile.filename,
        content: uploadedFile.content,
        contentType: uploadedFile.type
      });
    }
  }

  // Build reporting replacements for email template
  const replacements = await buildReportingReplacements({
    reportType: automation_params.reportType,
    frequency: automation_params.frequency,
    organizationId: organization_id,
    reportLevel: automation_params.reportLevel,
    projectDetails: { ...projectDetails, owner_name: full_name }
  });
  const params = automation.params!;
  // Replace variables in subject and body
  const processedParams = {
    ...params,
    subject: replaceTemplateVariables(params.subject || '', replacements),
    body: replaceTemplateVariables(params.body || '', replacements),
    attachments: attachments
  };

  // Enqueue with processed params
  await enqueueAutomationAction(automation.action_key, processedParams);
}

export const createAutomationWorker = () => {
  const automationWorker = new Worker(
    'automation-actions',
    async (job: Job) => {
      const name = job.name;
      console.log(`Received job of type: ${name}`);
      if (name === "send_vendor_notification") {
        await sendVendorReviewDateNotification();
      } else if (name === "send_report_notification") {
        await sendReportNotification();
      } else if (name === "send_report_notification_daily") {
        await sendReportNotificationEmail(job.data);
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