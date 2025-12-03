import React, { useState } from "react";
import { Box, Stack, Typography, useTheme, Avatar as MuiAvatar, Snackbar } from "@mui/material";
import { Copy } from "lucide-react";
import CodeBlock from "../components/CodeBlock";

const avatarSnippets = {
  basic: `import { Avatar as MuiAvatar } from "@mui/material";

<MuiAvatar
  alt="John Doe"
  sx={{ width: 40, height: 40 }}
>
  JD
</MuiAvatar>`,
  withImage: `<MuiAvatar
  alt="John Doe"
  src="/path/to/image.jpg"
  sx={{ width: 40, height: 40 }}
/>`,
  sizes: `// Small (32px)
<MuiAvatar sx={{ width: 32, height: 32, fontSize: 14 }}>JD</MuiAvatar>

// Medium (40px) - Default
<MuiAvatar sx={{ width: 40, height: 40, fontSize: 16 }}>JD</MuiAvatar>

// Large (64px)
<MuiAvatar sx={{ width: 64, height: 64, fontSize: 22 }}>JD</MuiAvatar>`,
  colorGeneration: `// Generate consistent color from string
const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += \`00\${value.toString(16)}\`.slice(-2);
  }
  return color;
};

<MuiAvatar
  sx={{ backgroundColor: stringToColor("John Doe") }}
>
  JD
</MuiAvatar>`,
  withBorder: `<MuiAvatar
  sx={{
    width: 40,
    height: 40,
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      border: "2px solid rgba(255,255,255,0.2)",
      borderRadius: "50%",
    },
  }}
>
  JD
</MuiAvatar>`,
  group: `import { AvatarGroup } from "@mui/material";

<AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 14 } }}>
  <MuiAvatar>JD</MuiAvatar>
  <MuiAvatar>AB</MuiAvatar>
  <MuiAvatar>CD</MuiAvatar>
  <MuiAvatar>EF</MuiAvatar>
  <MuiAvatar>GH</MuiAvatar>
</AvatarGroup>`,
};

// Color generation function (same as in Avatar component)
const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const AvatarsSection: React.FC = () => {
  const theme = useTheme();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleUsers = [
    { name: "John Doe", initials: "JD" },
    { name: "Alice Brown", initials: "AB" },
    { name: "Carlos Davis", initials: "CD" },
    { name: "Emma Foster", initials: "EF" },
    { name: "George Hill", initials: "GH" },
  ];

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
          Avatars
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.tertiary,
            maxWidth: 600,
          }}
        >
          User avatars with automatic color generation and fallback initials.
          Uses MUI Avatar with VerifyWise styling conventions.
        </Typography>
      </Box>

      {/* Basic Avatars */}
      <SpecSection title="Basic avatars">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Avatars display user initials when no image is provided. Colors are
          automatically generated based on the user's name for consistency.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Initials avatar"
                code={avatarSnippets.basic}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    p: "24px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  {sampleUsers.slice(0, 4).map((user) => (
                    <MuiAvatar
                      key={user.name}
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: 16,
                        backgroundColor: stringToColor(user.name),
                        color: "white",
                      }}
                    >
                      {user.initials}
                    </MuiAvatar>
                  ))}
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Avatar sizes"
                code={avatarSnippets.sizes}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "24px",
                    alignItems: "center",
                    p: "24px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <MuiAvatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        backgroundColor: stringToColor("John Doe"),
                        color: "white",
                        mb: "8px",
                      }}
                    >
                      JD
                    </MuiAvatar>
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.tertiary }}>
                      32px
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <MuiAvatar
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: 16,
                        backgroundColor: stringToColor("Alice Brown"),
                        color: "white",
                        mb: "8px",
                      }}
                    >
                      AB
                    </MuiAvatar>
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.tertiary }}>
                      40px
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <MuiAvatar
                      sx={{
                        width: 64,
                        height: 64,
                        fontSize: 22,
                        backgroundColor: stringToColor("Carlos Davis"),
                        color: "white",
                        mb: "8px",
                      }}
                    >
                      CD
                    </MuiAvatar>
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.tertiary }}>
                      64px
                    </Typography>
                  </Box>
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="With inner border"
                code={avatarSnippets.withBorder}
                onCopy={handleCopy}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    p: "24px",
                    backgroundColor: theme.palette.background.fill,
                    borderRadius: "4px",
                  }}
                >
                  {sampleUsers.slice(0, 3).map((user, index) => (
                    <MuiAvatar
                      key={user.name}
                      sx={{
                        width: index === 1 ? 64 : 40,
                        height: index === 1 ? 64 : 40,
                        fontSize: index === 1 ? 22 : 16,
                        backgroundColor: stringToColor(user.name),
                        color: "white",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: `${index === 1 ? 3 : 2}px solid rgba(255,255,255,0.2)`,
                          borderRadius: "50%",
                        },
                      }}
                    >
                      {user.initials}
                    </MuiAvatar>
                  ))}
                </Box>
              </ExampleWithCode>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Size reference
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Small", value: "32px (fontSize: 14px)" },
                { property: "Medium (default)", value: "40px (fontSize: 16px)" },
                { property: "Large", value: "64px (fontSize: 22px)" },
              ]}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "24px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Styling specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Shape", value: "Circle (borderRadius: 50%)" },
                { property: "Text color", value: "#FFFFFF (white)" },
                { property: "Font weight", value: "400 (regular)" },
                { property: "Inner border", value: "2-3px rgba(255,255,255,0.2)" },
                { property: "Background", value: "Generated from name" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      {/* Color Generation */}
      <SpecSection title="Color generation">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Avatar colors are deterministically generated from the user's name using a hash function.
          This ensures the same user always gets the same color across the application.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <ExampleWithCode
              label="Consistent colors from names"
              code={avatarSnippets.colorGeneration}
              onCopy={handleCopy}
            >
              <Box
                sx={{
                  p: "24px",
                  backgroundColor: theme.palette.background.fill,
                  borderRadius: "4px",
                }}
              >
                <Stack spacing="12px">
                  {sampleUsers.map((user) => (
                    <Box
                      key={user.name}
                      sx={{ display: "flex", alignItems: "center", gap: "12px" }}
                    >
                      <MuiAvatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          backgroundColor: stringToColor(user.name),
                          color: "white",
                        }}
                      >
                        {user.initials}
                      </MuiAvatar>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                        {user.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: theme.palette.text.tertiary,
                        }}
                      >
                        {stringToColor(user.name)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </ExampleWithCode>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Algorithm
            </Typography>
            <Box
              sx={{
                p: "16px",
                backgroundColor: theme.palette.background.alt,
                borderRadius: "4px",
                border: `1px solid ${theme.palette.border.light}`,
              }}
            >
              <Stack spacing="8px">
                <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                  1. Convert each character to its char code
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                  2. Accumulate hash: charCode + ((hash &lt;&lt; 5) - hash)
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                  3. Extract RGB values from hash bits
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                  4. Format as hex color string
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </SpecSection>

      {/* Avatar Groups */}
      <SpecSection title="Avatar groups">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Use MUI AvatarGroup to display multiple avatars with automatic overflow handling.
        </Typography>

        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <ExampleWithCode
              label="Avatar group with max limit"
              code={avatarSnippets.group}
              onCopy={handleCopy}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  p: "24px",
                  backgroundColor: theme.palette.background.fill,
                  borderRadius: "4px",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 11, color: theme.palette.text.tertiary, mb: "8px" }}>
                    max=4 (shows +1 overflow)
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        fontSize: 12,
                        border: `2px solid ${theme.palette.background.fill}`,
                        marginLeft: "-8px",
                        "&:first-of-type": { marginLeft: 0 },
                      },
                    }}
                  >
                    {sampleUsers.slice(0, 4).map((user) => (
                      <MuiAvatar
                        key={user.name}
                        sx={{
                          backgroundColor: stringToColor(user.name),
                          color: "white",
                        }}
                      >
                        {user.initials}
                      </MuiAvatar>
                    ))}
                    <MuiAvatar
                      sx={{
                        backgroundColor: theme.palette.grey[300],
                        color: theme.palette.text.primary,
                        fontSize: "11px !important",
                      }}
                    >
                      +1
                    </MuiAvatar>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 11, color: theme.palette.text.tertiary, mb: "8px" }}>
                    max=3 (shows +2 overflow)
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        fontSize: 12,
                        border: `2px solid ${theme.palette.background.fill}`,
                        marginLeft: "-8px",
                        "&:first-of-type": { marginLeft: 0 },
                      },
                    }}
                  >
                    {sampleUsers.slice(0, 3).map((user) => (
                      <MuiAvatar
                        key={user.name}
                        sx={{
                          backgroundColor: stringToColor(user.name),
                          color: "white",
                        }}
                      >
                        {user.initials}
                      </MuiAvatar>
                    ))}
                    <MuiAvatar
                      sx={{
                        backgroundColor: theme.palette.grey[300],
                        color: theme.palette.text.primary,
                        fontSize: "11px !important",
                      }}
                    >
                      +2
                    </MuiAvatar>
                  </Box>
                </Box>
              </Box>
            </ExampleWithCode>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AvatarGroup props
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "max", value: "Number of visible avatars" },
                { property: "spacing", value: "Overlap spacing (default: medium)" },
                { property: "total", value: "Override total count for +N" },
              ]}
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.text.secondary, mb: "16px", mt: "24px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Group styling
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Overlap", value: "marginLeft: -8px" },
                { property: "Border", value: "2px solid (background color)" },
                { property: "Overflow background", value: "grey[300]" },
                { property: "Overflow font size", value: "11px" },
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
            "Use stringToColor() for consistent avatar colors across the app",
            "Always provide alt text for accessibility",
            "Use 32px for compact lists, 40px default, 64px for profiles",
            "Add inner border (rgba(255,255,255,0.2)) for visual polish",
            "Use AvatarGroup with max prop to handle overflow gracefully",
            "Fallback to initials when image fails to load",
            "Keep initials to 2 characters (first name + last name)",
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
    <Box sx={{ mb: "40px" }}>
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

export default AvatarsSection;
