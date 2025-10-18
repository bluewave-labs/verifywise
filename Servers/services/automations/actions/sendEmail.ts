import { sendAutomationEmail } from "../../emailService";

const sendEmail = async (data: Object) => {
  sendAutomationEmail(
    (data as any).to as string[],
    (data as any).subject,
    (data as any).body
  );
}

export default sendEmail;