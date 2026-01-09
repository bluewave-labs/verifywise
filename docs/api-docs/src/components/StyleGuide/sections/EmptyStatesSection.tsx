import React, { useState } from "react";
import { Box, Stack, Typography, useTheme, Divider, Snackbar } from "@mui/material";
import { Copy } from "lucide-react";
import CodeBlock from "../CodeBlock";

// Mock EmptyState Component
interface MockEmptyStateProps {
  message?: string;
  showHalo?: boolean;
  showBorder?: boolean;
}

const MockEmptyState: React.FC<MockEmptyStateProps> = ({
  message = "There is currently no data available for this section.",
  showHalo = false,
  showBorder = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "75px",
        paddingBottom: "32px",
        backgroundColor: "#ffffff",
        border: showBorder ? "1px solid #d0d5dd" : "none",
        borderRadius: "4px",
        position: "relative",
      }}
    >
      {/* Halo effect */}
      {showHalo && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(19, 113, 91, 0.08) 0%, rgba(19, 113, 91, 0) 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Skeleton Cards Stack */}
      <Box sx={{ position: "relative", zIndex: 1, mb: "24px" }}>
        <MockSkeletonCard showHalo={showHalo} />
      </Box>

      {/* Message */}
      <Typography
        sx={{
          fontSize: "13px",
          fontWeight: 400,
          color: "#9CA3AF",
          textAlign: "center",
          maxWidth: "400px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

// Mock SkeletonCard Component
interface MockSkeletonCardProps {
  width?: number;
  showHalo?: boolean;
}

const MockSkeletonCard: React.FC<MockSkeletonCardProps> = ({
  width = 216,
  showHalo = true,
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: `${width}px`,
      }}
    >
      {/* Stack of 3 cards with offset */}
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            position: index === 0 ? "relative" : "absolute",
            top: index === 0 ? 0 : `${index * 4}px`,
            left: 0,
            right: 0,
            height: "57.6px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: showHalo ? "0 8px 30px rgba(0,0,0,.08)" : "0 2px 8px rgba(0,0,0,.04)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            opacity: index === 0 ? 1 : 0.6 - index * 0.2,
            animation: index === 0 ? "pulse 1.6s ease-in-out infinite" : "none",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.72 },
            },
            zIndex: 3 - index,
          }}
        >
          {/* Block (icon placeholder) */}
          <Box
            sx={{
              width: "54px",
              height: "33.6px",
              backgroundColor: "#f3f4f6",
              borderRadius: "7.2px",
              flexShrink: 0,
            }}
          />

          {/* Lines (text placeholder) */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Box
              sx={{
                height: "7.2px",
                backgroundColor: "#f3f4f6",
                borderRadius: "3.6px",
                width: "80%",
              }}
            />
            <Box
              sx={{
                height: "7.2px",
                backgroundColor: "#f3f4f6",
                borderRadius: "3.6px",
                width: "60%",
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const emptyStateSnippets = {
  basic: `import EmptyState from "../EmptyState";

<EmptyState />`,
  customMessage: `<EmptyState
  message="No projects found. Create your first project to get started."
/>`,
  withHalo: `<EmptyState
  message="No data available"
  showHalo={true}
/>`,
  withBorder: `<EmptyState
  message="No items in this list"
  showBorder={true}
/>`,
  skeletonCard: `import SkeletonCard from "../SkeletonCard";

<SkeletonCard />
<SkeletonCard width={180} showHalo={false} />`,
};

const EmptyStatesSection: React.FC = () => {
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
          Empty states
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.tertiary,
            maxWidth: 600,
          }}
        >
          Components for displaying empty or no-data states in tables and lists.
          Uses animated skeleton cards for visual feedback.
        </Typography>
      </Box>

      {/* EmptyState Component */}
      <SpecSection title="EmptyState component">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Reusable component for tables and lists when no data is available.
          Displays a SkeletonCard stack with a customizable message.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Default empty state"
                code={emptyStateSnippets.basic}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <MockEmptyState />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Custom message"
                code={emptyStateSnippets.customMessage}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <MockEmptyState message="No projects found. Create your first project to get started." />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="With border (standalone container)"
                code={emptyStateSnippets.withBorder}
                onCopy={handleCopy}
              >
                <MockEmptyState
                  message="No items in this list"
                  showBorder={true}
                />
              </ExampleWithCode>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              EmptyState props
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "message", value: '"There is currently no data..."' },
                { property: "imageAlt", value: '"No data available"' },
                { property: "showHalo", value: "false (default)" },
                { property: "showBorder", value: "false (default)" },
              ]}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "24px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Styling specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Padding top", value: "75px" },
                { property: "Padding bottom", value: "32px (theme.spacing(16))" },
                { property: "Message font size", value: "13px" },
                { property: "Message color", value: "#9CA3AF" },
                { property: "Message font weight", value: "400" },
                { property: "Border (when shown)", value: "1px solid #d0d5dd" },
                { property: "Border radius", value: "4px" },
                { property: "Background", value: "#FFFFFF" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* SkeletonCard Component */}
      <SpecSection title="SkeletonCard component">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Animated skeleton card stack used in EmptyState. Shows pulsing skeleton elements.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Default skeleton card"
                code={emptyStateSnippets.skeletonCard}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: "40px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  <MockSkeletonCard />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Without halo effect"
                code={`<SkeletonCard showHalo={false} />`}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: "40px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  <MockSkeletonCard showHalo={false} />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Custom width"
                code={`<SkeletonCard width={180} />`}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: "40px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  <MockSkeletonCard width={180} />
                </Box>
              </ExampleWithCode>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SkeletonCard props
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "width", value: "216 (60% of 360)" },
                { property: "showHalo", value: "true (default)" },
              ]}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "24px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Card styling
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Card height", value: "57.6px" },
                { property: "Card border radius", value: "12px" },
                { property: "Card background", value: "#ffffff" },
                { property: "Card shadow", value: "0 8px 30px rgba(0,0,0,.08)" },
                { property: "Block width", value: "54px" },
                { property: "Block height", value: "33.6px" },
                { property: "Block radius", value: "7.2px" },
                { property: "Block background", value: "#f3f4f6" },
                { property: "Line height", value: "7.2px" },
              ]}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "24px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Animations
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Pulse animation", value: "1.6s ease-in-out infinite" },
                { property: "Float animation", value: "3s ease-in-out (5 times)" },
                { property: "Pulse opacity", value: "1 → 0.72 → 1" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      {/* Developer Checklist */}
      <Box
        sx={{
          mt: "40px",
          p: "24px",
          backgroundColor: theme.palette.background.accent,
          borderRadius: "4px",
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
          Developer checklist
        </Typography>
        <Stack spacing="8px">
          {[
            "Use EmptyState for table cells when no data is available",
            "Set showBorder={true} for standalone containers (not inside tables)",
            "Set showHalo={true} for full-page empty states",
            "Customize message prop for context-specific feedback",
            "EmptyState includes proper ARIA role='img' for accessibility",
            "SkeletonCard animations auto-play - no interaction needed",
            "Default size is 60% of original design for compactness",
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  mt: "6px",
                  flexShrink: 0,
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
  const [showCode, setShowCode] = useState(true);

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
          <CodeBlock code={code} language="tsx" onCopy={onCopy} />
        </Box>
      )}
    </Box>
  );
};

export default EmptyStatesSection;
