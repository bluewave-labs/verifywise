import { sendAutomationEmail } from "../../emailService";

const sendEmail = async (data: Object) => {
  // Convert plain text line breaks to HTML <br> tags for proper email formatting
  const htmlBody = (data as any).body.replace(/\n/g, '<br>');

  sendAutomationEmail(
    (data as any).to as string[],
    (data as any).subject,
    htmlBody
  );
}

export default sendEmail;