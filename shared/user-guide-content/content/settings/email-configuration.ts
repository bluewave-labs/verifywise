import type { ArticleContent } from '../../contentTypes';

export const emailConfigurationContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise uses email for account-related communications such as user invitations, password resets, and verification emails. For self-hosted deployments, you need to configure an email provider to enable these features.',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports multiple email providers to accommodate different infrastructure requirements. Choose the provider that best fits your organization\'s existing setup and security requirements.',
    },
    {
      type: 'heading',
      id: 'supported-providers',
      level: 2,
      text: 'Supported providers',
    },
    {
      type: 'paragraph',
      text: 'The following email providers are supported:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Resend', text: 'Recommended for development and small deployments. Simple API-based setup.' },
        { bold: 'Generic SMTP', text: 'Works with Gmail, Outlook, Yahoo, and custom mail servers.' },
        { bold: 'Exchange Online', text: 'For organizations using Microsoft 365.' },
        { bold: 'Exchange On-Premises', text: 'For self-hosted Microsoft Exchange environments.' },
        { bold: 'Amazon SES', text: 'For AWS-based deployments and high-volume sending.' },
      ],
    },
    {
      type: 'heading',
      id: 'core-settings',
      level: 2,
      text: 'Core settings',
    },
    {
      type: 'paragraph',
      text: 'All email configurations require these environment variables:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'EMAIL_PROVIDER', text: 'The provider to use: resend, smtp, exchange-online, exchange-onprem, or amazon-ses' },
        { bold: 'EMAIL_ID', text: 'The verified sender email address. Must match a domain verified with your provider.' },
      ],
    },
    {
      type: 'heading',
      id: 'resend',
      level: 2,
      text: 'Resend',
    },
    {
      type: 'paragraph',
      text: 'Resend is the simplest option to configure and is recommended for development environments and smaller deployments. You will need to create a Resend account and verify your sending domain.',
    },
    {
      type: 'paragraph',
      text: 'Required environment variables:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `EMAIL_PROVIDER=resend
EMAIL_ID=notifications@yourdomain.com
RESEND_API_KEY=re_your_api_key_here`,
    },
    {
      type: 'paragraph',
      text: 'To get your API key, sign up at resend.com, add your domain, and generate an API key from the dashboard.',
    },
    {
      type: 'heading',
      id: 'smtp',
      level: 2,
      text: 'Generic SMTP',
    },
    {
      type: 'paragraph',
      text: 'The SMTP provider works with any standard mail server including Gmail, Outlook, Yahoo, and custom servers. For providers that require two-factor authentication, you will need to generate an app password.',
    },
    {
      type: 'paragraph',
      text: 'Required environment variables:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `EMAIL_PROVIDER=smtp
EMAIL_ID=notifications@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false`,
    },
    {
      type: 'paragraph',
      text: 'Common SMTP server settings:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Gmail', text: 'smtp.gmail.com, port 587, SMTP_SECURE=false' },
        { bold: 'Outlook', text: 'smtp.office365.com, port 587, SMTP_SECURE=false' },
        { bold: 'Yahoo', text: 'smtp.mail.yahoo.com, port 587, SMTP_SECURE=false' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'App passwords',
      text: 'If your email account uses two-factor authentication, you must generate an app password instead of using your regular account password. Check your provider\'s documentation for instructions on creating app passwords.',
    },
    {
      type: 'heading',
      id: 'exchange-online',
      level: 2,
      text: 'Exchange Online (Microsoft 365)',
    },
    {
      type: 'paragraph',
      text: 'For organizations using Microsoft 365, Exchange Online provides enterprise-grade email delivery. This configuration uses app passwords for authentication rather than account passwords.',
    },
    {
      type: 'paragraph',
      text: 'Required environment variables:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `EMAIL_PROVIDER=exchange-online
EMAIL_ID=notifications@yourcompany.com
EXCHANGE_ONLINE_USER=service-account@yourcompany.com
EXCHANGE_ONLINE_PASS=your-app-password-here`,
    },
    {
      type: 'paragraph',
      text: 'To set up Exchange Online:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Create a dedicated service account in Microsoft 365' },
        { text: 'Enable app passwords for the service account' },
        { text: 'Generate an app password from the Microsoft account security settings' },
        { text: 'Use the app password in the EXCHANGE_ONLINE_PASS variable' },
      ],
    },
    {
      type: 'heading',
      id: 'exchange-onprem',
      level: 2,
      text: 'Exchange On-Premises',
    },
    {
      type: 'paragraph',
      text: 'For organizations with self-hosted Microsoft Exchange servers, the on-premises configuration provides additional options for authentication and TLS certificates.',
    },
    {
      type: 'paragraph',
      text: 'Required environment variables:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `EMAIL_PROVIDER=exchange-onprem
EMAIL_ID=notifications@yourcompany.com
EXCHANGE_ONPREM_HOST=mail.yourcompany.com
EXCHANGE_ONPREM_PORT=587
EXCHANGE_ONPREM_USER=serviceaccount
EXCHANGE_ONPREM_PASS=password
EXCHANGE_ONPREM_DOMAIN=YOURCOMPANY
EXCHANGE_ONPREM_SECURE=false
EXCHANGE_ALLOW_SELF_SIGNED=false
EXCHANGE_CUSTOM_CA_PATH=/etc/ssl/certs/company-ca.pem`,
    },
    {
      type: 'paragraph',
      text: 'Configuration options:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'EXCHANGE_ONPREM_DOMAIN', text: 'Your Active Directory domain name' },
        { bold: 'EXCHANGE_ONPREM_SECURE', text: 'Set to true if your server requires SSL from the start' },
        { bold: 'EXCHANGE_ALLOW_SELF_SIGNED', text: 'Set to true only if using self-signed certificates (not recommended for production)' },
        { bold: 'EXCHANGE_CUSTOM_CA_PATH', text: 'Path to your organization\'s CA certificate if using internal PKI' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Service account requirements',
      text: 'The service account must have SMTP authentication enabled in Active Directory and appropriate Send As permissions for the sender address.',
    },
    {
      type: 'heading',
      id: 'amazon-ses',
      level: 2,
      text: 'Amazon SES',
    },
    {
      type: 'paragraph',
      text: 'Amazon Simple Email Service is ideal for AWS-based deployments and high-volume email sending. You will need to verify your sending domain and request production access if you are in the SES sandbox.',
    },
    {
      type: 'paragraph',
      text: 'Required environment variables:',
    },
    {
      type: 'code',
      language: 'bash',
      code: `EMAIL_PROVIDER=amazon-ses
EMAIL_ID=notifications@yourdomain.com
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_API_VERSION=2010-12-01`,
    },
    {
      type: 'paragraph',
      text: 'Optional settings:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'SES_CONFIGURATION_SET', text: 'Name of an SES configuration set for tracking and monitoring' },
        { bold: 'AWS_CREDENTIAL_REFRESH_INTERVAL_MS', text: 'Interval for credential rotation in milliseconds (default: 3600000 / 1 hour)' },
      ],
    },
    {
      type: 'paragraph',
      text: 'To set up Amazon SES:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Verify your sending domain in the SES console' },
        { text: 'Request production access if still in sandbox mode' },
        { text: 'Create an IAM user with ses:SendEmail and ses:SendRawEmail permissions' },
        { text: 'Generate access keys for the IAM user' },
      ],
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security considerations',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise implements several security measures for email sending:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'TLS enforcement', text: 'All providers use TLS 1.2 or higher for encrypted connections' },
        { bold: 'Input validation', text: 'Email addresses and content are validated to prevent header injection attacks' },
        { bold: 'Credential security', text: 'All credentials must be stored in environment variables, never in code' },
        { bold: 'Certificate validation', text: 'Custom CA certificates for on-premises Exchange are validated for path traversal' },
      ],
    },
    {
      type: 'heading',
      id: 'production-checklist',
      level: 2,
      text: 'Production checklist',
    },
    {
      type: 'paragraph',
      text: 'Before deploying to production, verify the following:',
    },
    {
      type: 'checklist',
      items: [
        'Sending domain is verified with your email provider',
        'Using a dedicated service account rather than personal credentials',
        'App passwords are used instead of account passwords where applicable',
        'Credentials are stored in environment variables only',
        'TLS is enabled for SMTP connections (SMTP_SECURE or STARTTLS)',
        'Service account has minimal required permissions',
        'Tested email delivery by triggering a password reset or invitation',
      ],
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise validates email configuration on startup and logs the results. Check the application logs if emails are not being delivered.',
    },
    {
      type: 'paragraph',
      text: 'Common issues:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Authentication failed', text: 'Verify credentials are correct and app passwords are used if 2FA is enabled' },
        { bold: 'Domain not verified', text: 'Ensure the EMAIL_ID domain is verified with your provider' },
        { bold: 'Connection refused', text: 'Check firewall rules and verify the SMTP host and port are correct' },
        { bold: 'TLS errors', text: 'Verify TLS settings match your server requirements' },
        { bold: 'SES sandbox', text: 'Request production access if emails only reach verified addresses' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'getting-started',
          articleId: 'installing',
          title: 'Installing VerifyWise',
          description: 'Deploy VerifyWise in your environment',
        },
        {
          collectionId: 'settings',
          articleId: 'notifications',
          title: 'Notification settings',
          description: 'Configure governance notifications',
        },
        {
          collectionId: 'settings',
          articleId: 'user-management',
          title: 'User management',
          description: 'Invite and manage team members',
        },
      ],
    },
  ],
};
