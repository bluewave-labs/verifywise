import React, { useState } from "react";
import { Box, Stack, Typography, useTheme, Divider, Snackbar } from "@mui/material";
import { Copy, Check, X } from "lucide-react";
import CodeBlock from "../CodeBlock";

const documentationSnippets = {
  headingStructure: `# Article title (H1)
Brief description of what this article covers.

## Main section heading (H2)
Content for this section...

### Subsection heading (H3)
More specific content...`,

  paragraphStyle: `// Good - concise, action-oriented
Navigate to the Settings page and select "Organization."

// Bad - wordy and passive
The Settings page can be found in the navigation menu,
where you will then need to locate and click on the
"Organization" option.`,

  listUsage: `## Steps to complete

1. Navigate to **Settings > Organization**.
2. Click the **Add member** button.
3. Enter the user's email address.
4. Select a role from the dropdown.
5. Click **Send invitation**.

## Features included

- Role-based access control
- Custom permission sets
- Audit logging
- Single sign-on (SSO) support`,

  linkStyle: `// Inline reference
For more details, see [Managing user permissions](/user-guide/settings/user-management).

// Related articles
**Related articles:**
- [Role configuration](/user-guide/settings/role-configuration)
- [Organization settings](/user-guide/settings/organization-settings)`,

  calloutExample: `> **Note:** This feature requires admin permissions.

> **Tip:** You can also access this from the dashboard quick actions.

> **Warning:** This action cannot be undone.`,
};

const DocumentationGuidelinesSection: React.FC = () => {
  const theme = useTheme();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Box sx={{ p: "32px 40px" }}>
      <Snackbar
        open={!!copiedText}
        autoHideDuration={2000}
        onClose={() => setCopiedText(null)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Page Header */}
      <Box sx={{ mb: "32px" }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "8px",
          }}
        >
          Documentation writing guidelines
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.tertiary,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          Standards and best practices for writing clear, consistent, and user-friendly
          documentation for the VerifyWise User Guide.
        </Typography>
      </Box>

      {/* Voice & Tone */}
      <SpecSection title="Voice and tone">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Write with a professional yet approachable tone. Be helpful without being overly casual.
          Focus on clarity and actionability.
        </Typography>

        <Box sx={{ display: "flex", gap: "24px", flexWrap: "wrap", mb: "24px" }}>
          <GuidelineCard
            theme={theme}
            type="do"
            title="Do"
            items={[
              "Use active voice (\"Click the button\" not \"The button should be clicked\")",
              "Be concise - one idea per sentence",
              "Address the reader directly using \"you\"",
              "Use present tense for instructions",
              "Explain the \"why\" when it helps understanding",
            ]}
          />
          <GuidelineCard
            theme={theme}
            type="dont"
            title="Don't"
            items={[
              "Use jargon without explanation",
              "Write long, complex sentences",
              "Use vague language (\"simply\", \"just\", \"easily\")",
              "Assume prior knowledge without context",
              "Include unnecessary words or filler",
            ]}
          />
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Heading Structure */}
      <SpecSection title="Heading structure">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Use a clear hierarchy of headings to organize content. Each article should have
          one H1 (the title), with H2 for main sections and H3 for subsections.
        </Typography>

        <ExampleWithCode
          label="Heading hierarchy example"
          code={documentationSnippets.headingStructure}
          onCopy={handleCopy}
        >
          <Box sx={{ p: "16px" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#1C2130", mb: "8px" }}>
              Article title (H1)
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#667085", mb: "16px" }}>
              Brief description of what this article covers.
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#344054", mb: "8px" }}>
              Main section heading (H2)
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#475467" }}>
              Subsection heading (H3)
            </Typography>
          </Box>
        </ExampleWithCode>

        <Box sx={{ mt: "24px" }}>
          <SpecTable
            onCopy={handleCopy}
            specs={[
              { property: "H1 (Article title)", value: "28px, 600 weight" },
              { property: "H2 (Section)", value: "20px, 600 weight" },
              { property: "H3 (Subsection)", value: "16px, 600 weight" },
              { property: "Body text", value: "14px, 400 weight" },
              { property: "Section gap", value: "32px (after H2)" },
              { property: "Subsection gap", value: "24px (after H3)" },
            ]}
          />
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Paragraph Guidelines */}
      <SpecSection title="Paragraphs and sentences">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Keep paragraphs short (1-3 sentences). Break complex concepts into digestible chunks.
          Start with the most important information.
        </Typography>

        <ExampleWithCode
          label="Writing style comparison"
          code={documentationSnippets.paragraphStyle}
          onCopy={handleCopy}
        >
          <Box sx={{ p: "16px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "8px" }}>
              <Check size={14} color="#17b26a" />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#17b26a" }}>GOOD</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: "#344054", mb: "16px" }}>
              Navigate to the Settings page and select "Organization."
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "8px" }}>
              <X size={14} color="#DB504A" />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#DB504A" }}>AVOID</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              The Settings page can be found in the navigation menu, where you will then need
              to locate and click on the "Organization" option.
            </Typography>
          </Box>
        </ExampleWithCode>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Lists */}
      <SpecSection title="Lists and steps">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Use numbered lists for sequential steps. Use bullet points for non-sequential items
          or feature lists. Keep list items parallel in structure.
        </Typography>

        <ExampleWithCode
          label="List formatting"
          code={documentationSnippets.listUsage}
          onCopy={handleCopy}
        >
          <Box sx={{ p: "16px" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#344054", mb: "12px" }}>
              Steps to complete
            </Typography>
            <Box component="ol" sx={{ pl: "20px", m: 0, "& li": { fontSize: 13, color: "#475467", mb: "6px" } }}>
              <li>Navigate to <strong>Settings &gt; Organization</strong>.</li>
              <li>Click the <strong>Add member</strong> button.</li>
              <li>Enter the user's email address.</li>
            </Box>
          </Box>
        </ExampleWithCode>

        <Box sx={{ mt: "24px" }}>
          <GuidelinesBox
            theme={theme}
            items={[
              "Use numbered lists only for sequential procedures",
              "Start each list item with a verb when describing actions",
              "Use bold for UI elements (buttons, menu items, field names)",
              "Keep list items to one sentence when possible",
              "Limit nested lists to one level deep",
            ]}
          />
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Links */}
      <SpecSection title="Links and references">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Use descriptive link text that tells users where the link goes. Avoid "click here"
          or "learn more" as standalone link text.
        </Typography>

        <ExampleWithCode
          label="Link formatting"
          code={documentationSnippets.linkStyle}
          onCopy={handleCopy}
        >
          <Box sx={{ p: "16px" }}>
            <Typography sx={{ fontSize: 13, color: "#475467", mb: "16px" }}>
              For more details, see{" "}
              <Typography component="span" sx={{ color: "#13715B", fontWeight: 500, cursor: "pointer" }}>
                Managing user permissions
              </Typography>
              .
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: "8px" }}>
              Related articles:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Typography sx={{ fontSize: 13, color: "#13715B", fontWeight: 500, cursor: "pointer" }}>
                Role configuration
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#13715B", fontWeight: 500, cursor: "pointer" }}>
                Organization settings
              </Typography>
            </Box>
          </Box>
        </ExampleWithCode>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Callouts */}
      <SpecSection title="Callouts and notes">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Use callouts sparingly to highlight important information. Too many callouts
          reduce their effectiveness.
        </Typography>

        <Stack spacing="16px">
          <CalloutExample
            type="note"
            text="This feature requires admin permissions."
          />
          <CalloutExample
            type="tip"
            text="You can also access this from the dashboard quick actions."
          />
          <CalloutExample
            type="warning"
            text="This action cannot be undone."
          />
        </Stack>

        <Box sx={{ mt: "24px" }}>
          <ExampleWithCode
            label="Callout syntax"
            code={documentationSnippets.calloutExample}
            onCopy={handleCopy}
          >
            <Box sx={{ p: "8px" }} />
          </ExampleWithCode>
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Article Structure */}
      <SpecSection title="Article structure template">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px", lineHeight: 1.6 }}>
          Follow this structure for consistent article formatting across the User Guide.
        </Typography>

        <Box
          sx={{
            backgroundColor: theme.palette.background.alt,
            borderRadius: "8px",
            border: `1px solid ${theme.palette.border.light}`,
            overflow: "hidden",
          }}
        >
          {[
            { section: "1. Title", description: "Clear, action-oriented title (e.g., \"Managing model inventory\")" },
            { section: "2. Description", description: "1-2 sentence overview of what the article covers" },
            { section: "3. Prerequisites", description: "(Optional) What the user needs before starting" },
            { section: "4. Main content", description: "Step-by-step instructions or explanations" },
            { section: "5. Related articles", description: "Links to related documentation" },
          ].map((item, index, arr) => (
            <Box
              key={item.section}
              sx={{
                display: "flex",
                p: "16px 20px",
                borderBottom: index < arr.length - 1 ? `1px solid ${theme.palette.border.light}` : "none",
                gap: "16px",
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main, minWidth: 140 }}>
                {item.section}
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                {item.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </SpecSection>

      {/* Quick Reference */}
      <Box
        sx={{
          mt: "40px",
          p: "24px",
          backgroundColor: theme.palette.background.accent,
          borderRadius: "8px",
          border: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "16px",
          }}
        >
          Quick reference checklist
        </Typography>
        <Stack spacing="8px">
          {[
            "Use sentence case for headings and UI elements",
            "Bold UI elements: buttons, menu items, field names",
            "Use \"Select\" not \"Click on\" for dropdowns and options",
            "Write numbers 1-9 as words, 10+ as numerals",
            "Avoid future tense (\"will be\") - use present tense",
            "End procedures with the expected result",
            "Include alt text for all images",
            "Test all links before publishing",
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "4px",
                  border: `1.5px solid ${theme.palette.border.dark}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: "1px",
                }}
              />
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

// Helper Components

const SpecSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: "16px" }}>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: "16px",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

const SpecTable: React.FC<{
  specs: { property: string; value: string }[];
  onCopy: (text: string) => void;
}> = ({ specs, onCopy }) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.alt,
        borderRadius: "4px",
        border: `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      {specs.map((spec, index) => (
        <Box
          key={index}
          onClick={() => onCopy(spec.value)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: "10px 14px",
            borderBottom:
              index < specs.length - 1
                ? `1px solid ${theme.palette.border.light}`
                : "none",
            cursor: "pointer",
            transition: "background-color 150ms ease",
            "&:hover": {
              backgroundColor: theme.palette.background.fill,
            },
          }}
        >
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
            {spec.property}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.palette.text.primary,
                fontFamily: "monospace",
              }}
            >
              {spec.value}
            </Typography>
            {hoveredIndex === index && (
              <Copy size={12} color={theme.palette.primary.main} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const ExampleWithCode: React.FC<{
  label: string;
  code: string;
  onCopy: (text: string) => void;
  children: React.ReactNode;
}> = ({ label, code, onCopy, children }) => {
  const theme = useTheme();
  const [showCode, setShowCode] = useState(false);

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: "8px 12px",
          backgroundColor: theme.palette.background.alt,
          borderBottom: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>
          {label}
        </Typography>
        <Box
          onClick={() => setShowCode(!showCode)}
          sx={{
            fontSize: 11,
            color: showCode ? theme.palette.primary.main : theme.palette.text.tertiary,
            cursor: "pointer",
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          {showCode ? "Hide code" : "Show code"}
        </Box>
      </Box>

      <Box sx={{ backgroundColor: theme.palette.background.main }}>
        {children}
      </Box>

      {showCode && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }}>
          <CodeBlock code={code} language="markdown" onCopy={onCopy} />
        </Box>
      )}
    </Box>
  );
};

const GuidelineCard: React.FC<{
  theme: any;
  type: "do" | "dont";
  title: string;
  items: string[];
}> = ({ type, title, items }) => {
  const colors = type === "do"
    ? { bg: "#ECFDF3", border: "#A6F4C5", icon: "#17b26a", text: "#027A48" }
    : { bg: "#FEF3F2", border: "#FECDCA", icon: "#DB504A", text: "#B42318" };

  return (
    <Box
      sx={{
        flex: "1 1 280px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        p: "16px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px" }}>
        {type === "do" ? (
          <Check size={16} color={colors.icon} />
        ) : (
          <X size={16} color={colors.icon} />
        )}
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {title}
        </Typography>
      </Box>
      <Stack spacing="8px">
        {items.map((item, index) => (
          <Typography key={index} sx={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>
            • {item}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
};

const GuidelinesBox: React.FC<{
  theme: any;
  items: string[];
}> = ({ theme, items }) => (
  <Box
    sx={{
      backgroundColor: theme.palette.background.alt,
      borderRadius: "8px",
      border: `1px solid ${theme.palette.border.light}`,
      p: "16px",
    }}
  >
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      Guidelines
    </Typography>
    <Stack spacing="6px">
      {items.map((item, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              mt: "6px",
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, lineHeight: 1.5 }}>
            {item}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

const CalloutExample: React.FC<{
  type: "note" | "tip" | "warning";
  text: string;
}> = ({ type, text }) => {
  const configs = {
    note: { bg: "#E6F2EF", border: "#13715B", label: "Note", color: "#0A4A3A" },
    tip: { bg: "#EFF8FF", border: "#3B82F6", label: "Tip", color: "#1E40AF" },
    warning: { bg: "#FFFAEB", border: "#F59E0B", label: "Warning", color: "#92400E" },
  };

  const config = configs[type];

  return (
    <Box
      sx={{
        borderLeft: `3px solid ${config.border}`,
        backgroundColor: config.bg,
        pl: "16px",
        py: "12px",
        pr: "16px",
        borderRadius: "0 6px 6px 0",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: config.color, mb: "4px" }}>
        {config.label}
      </Typography>
      <Typography sx={{ fontSize: 13, color: config.color }}>
        {text}
      </Typography>
    </Box>
  );
};

export default DocumentationGuidelinesSection;
