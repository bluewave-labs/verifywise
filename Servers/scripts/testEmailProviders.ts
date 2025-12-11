/**
 * Test script for email providers
 * Run with: ts-node scripts/testEmailProviders.ts
 */

import dotenv from "dotenv";
import { EmailProviderFactory } from "../services/email/providers/EmailProviderFactory";
import { EmailOptions } from "../services/email/types";
import { compileMjmlToHtml } from "../tools/mjmlCompiler";

// Load environment variables
dotenv.config();

const testTemplate = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>
          <h1>Email Provider Test</h1>
          <p>Hello {{user_name}},</p>
          <p>This is a test email from VerifyWise using the {{provider_name}} provider.</p>
          <p>If you received this email, the provider is working correctly!</p>
          <p>Test time: {{test_time}}</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

async function testProvider(
  providerType: "resend" | "smtp",
  testEmail: string
) {
  console.log(`\n🧪 Testing ${providerType.toUpperCase()} provider...`);

  try {
    // Temporarily set provider type
    process.env.EMAIL_PROVIDER = providerType;

    // Create provider
    const provider = EmailProviderFactory.createProvider(providerType);
    console.log(`✅ Provider created: ${provider.getProviderName()}`);

    // Validate configuration
    const isValid = await provider.validateConfig();
    if (!isValid) {
      console.log(`❌ Configuration validation failed for ${providerType}`);
      return false;
    }
    console.log(`✅ Configuration validated`);

    // Prepare test email
    const templateData = {
      user_name: "Test User",
      provider_name: provider.getProviderName(),
      test_time: new Date().toISOString(),
    };

    const html = compileMjmlToHtml(testTemplate, templateData);

    const emailOptions: EmailOptions = {
      to: testEmail,
      subject: `VerifyWise Email Test - ${provider.getProviderName()}`,
      html: html,
    };

    // Send test email
    const result = await provider.sendEmail(emailOptions);

    if (result.success) {
      console.log(`✅ Email sent successfully!`);
      console.log(`📧 Message ID: ${result.messageId}`);
      return true;
    } else {
      console.log(`❌ Email failed to send:`);
      console.log(`   Error: ${result.error?.name} - ${result.error?.message}`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Provider test failed:`);
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    // Restore original provider
    if (process.env.EMAIL_PROVIDER) {
      delete process.env.EMAIL_PROVIDER;
    }
  }
}

async function main() {
  console.log("🚀 VerifyWise Email Provider Test Suite");
  console.log("=====================================");

  const testEmail = process.argv[2];
  if (!testEmail) {
    console.log("❌ Please provide a test email address:");
    console.log("   ts-node scripts/testEmailProviders.ts test@example.com");
    process.exit(1);
  }

  console.log(`📧 Test emails will be sent to: ${testEmail}`);

  const results: { [key: string]: boolean } = {};

  // Test Resend provider (if configured)
  if (process.env.RESEND_API_KEY) {
    results.resend = await testProvider("resend", testEmail);
  } else {
    console.log("\n⚠️  Skipping Resend test - RESEND_API_KEY not configured");
  }

  // Test SMTP provider (if configured)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    results.smtp = await testProvider("smtp", testEmail);
  } else {
    console.log("\n⚠️  Skipping SMTP test - SMTP configuration not found");
  }

  // Summary
  console.log("\n📊 Test Results Summary");
  console.log("=====================");

  let allPassed = true;
  for (const [provider, passed] of Object.entries(results)) {
    const status = passed ? "✅ PASSED" : "❌ FAILED";
    console.log(`${provider.toUpperCase()}: ${status}`);
    if (!passed) allPassed = false;
  }

  if (Object.keys(results).length === 0) {
    console.log("⚠️  No providers were tested - check your configuration");
    process.exit(1);
  }

  if (allPassed) {
    console.log("\n🎉 All configured providers passed!");
    process.exit(0);
  } else {
    console.log("\n💥 Some providers failed - check configuration");
    process.exit(1);
  }
}

// Run the test
main().catch((error) => {
  console.error("💥 Test suite crashed:", error);
  process.exit(1);
});
