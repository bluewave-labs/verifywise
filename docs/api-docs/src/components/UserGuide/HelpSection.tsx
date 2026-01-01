import React from 'react';
import { MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { colors, typography, spacing, border } from '../../styles/theme';
import './HelpSection.css';

const HelpSection: React.FC = () => {
  return (
    <div
      style={{
        padding: spacing.xl,
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <h1
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.xs,
            marginTop: 0,
          }}
        >
          Need help?
        </h1>
        <p
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.normal,
            margin: 0,
          }}
        >
          We're here to assist you with any questions or issues you might have.
        </p>
      </div>

      {/* Help options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {/* Contact support */}
        <a
          href="mailto:support@verifywise.ai"
          className="help-card"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.md,
            padding: spacing.lg,
            backgroundColor: colors.background.white,
            border: border.default,
            borderRadius: border.radius,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: border.radius,
              backgroundColor: `${colors.brand.primary}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mail size={20} color={colors.brand.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}
            >
              Contact support
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              Send us an email and we'll get back to you within 24 hours.
            </span>
          </div>
          <ExternalLink size={16} color={colors.text.muted} style={{ flexShrink: 0, marginTop: 2 }} />
        </a>

        {/* Community */}
        <a
          href="https://github.com/verifywise/verifywise/discussions"
          target="_blank"
          rel="noopener noreferrer"
          className="help-card"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.md,
            padding: spacing.lg,
            backgroundColor: colors.background.white,
            border: border.default,
            borderRadius: border.radius,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: border.radius,
              backgroundColor: `${colors.brand.primary}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageCircle size={20} color={colors.brand.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}
            >
              Community discussions
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              Join our GitHub discussions to connect with other users and get help.
            </span>
          </div>
          <ExternalLink size={16} color={colors.text.muted} style={{ flexShrink: 0, marginTop: 2 }} />
        </a>
      </div>

      {/* FAQ placeholder */}
      <div style={{ marginTop: spacing['2xl'] }}>
        <h2
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.md,
            marginTop: 0,
          }}
        >
          Frequently asked questions
        </h2>
        <p
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          FAQ section coming soon...
        </p>
      </div>
    </div>
  );
};

export default HelpSection;
