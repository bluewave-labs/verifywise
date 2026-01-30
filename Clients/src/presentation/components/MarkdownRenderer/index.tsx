/**
 * MarkdownRenderer Component
 * 
 * Renders markdown content with proper formatting including:
 * - Code blocks with syntax highlighting
 * - Inline code
 * - Lists (ordered and unordered)
 * - Tables
 * - Bold, italic, strikethrough
 * - Links
 * - Blockquotes
 */

import { useState, ReactNode, Component, ErrorInfo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Error boundary to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
}

class MarkdownErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MarkdownRenderer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Simple code block component with copy button
const CodeBlock = ({
  language,
  code,
}: {
  language: string | undefined;
  code: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        position: "relative",
        my: 2,
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header with language label and copy button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          bgcolor: "#f3f4f6",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontFamily: "monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {language || "code"}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy code"}>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              width: 24,
              height: 24,
              color: copied ? "#13715B" : "#9ca3af",
              "&:hover": { color: "#374151", bgcolor: "#e5e7eb" },
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code content */}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          bgcolor: "#fafafa",
          overflow: "auto",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        <Box
          component="code"
          sx={{
            fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
            color: "#374151",
          }}
        >
          {code}
        </Box>
      </Box>
    </Box>
  );
};

// Helper to extract text from React children
const getTextFromChildren = (children: ReactNode): string => {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return getTextFromChildren((children as React.ReactElement).props.children);
  }
  return "";
};

function MarkdownContent({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks and inline code
        code(props) {
          const { className, children } = props;
          const match = /language-(\w+)/.exec(className || "");
          const codeString = getTextFromChildren(children).replace(/\n$/, "");
          
          // Check if this is a code block or inline code
          const isCodeBlock = Boolean(match) || Boolean(className);

          if (!isCodeBlock) {
            // Inline code
            return (
              <Box
                component="code"
                sx={{
                  px: 0.75,
                  py: 0.25,
                  bgcolor: "#f3f4f6",
                  borderRadius: "4px",
                  fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
                  fontSize: "0.875em",
                  color: "#dc2626",
                }}
              >
                {children}
              </Box>
            );
          }

          return <CodeBlock language={match?.[1]} code={codeString} />;
        },

        // Paragraphs
        p({ children }) {
          return (
            <Typography
              variant="body2"
              sx={{
                color: "#374151",
                lineHeight: 1.7,
                mb: 1.5,
                "&:last-child": { mb: 0 },
              }}
            >
              {children}
            </Typography>
          );
        },

        // Headings
        h1({ children }) {
          return (
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "#111827", mt: 3, mb: 1.5 }}
            >
              {children}
            </Typography>
          );
        },
        h2({ children }) {
          return (
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#111827", mt: 2.5, mb: 1.25 }}
            >
              {children}
            </Typography>
          );
        },
        h3({ children }) {
          return (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#111827", mt: 2, mb: 1 }}
            >
              {children}
            </Typography>
          );
        },

        // Lists
        ul({ children }) {
          return (
            <Box
              component="ul"
              sx={{
                pl: 2.5,
                mb: 1.5,
                "& li": {
                  color: "#374151",
                  lineHeight: 1.7,
                  mb: 0.5,
                  "&::marker": { color: "#9ca3af" },
                },
              }}
            >
              {children}
            </Box>
          );
        },
        ol({ children }) {
          return (
            <Box
              component="ol"
              sx={{
                pl: 2.5,
                mb: 1.5,
                "& li": {
                  color: "#374151",
                  lineHeight: 1.7,
                  mb: 0.5,
                  "&::marker": { color: "#6b7280", fontWeight: 500 },
                },
              }}
            >
              {children}
            </Box>
          );
        },

        // Blockquotes
        blockquote({ children }) {
          return (
            <Box
              component="blockquote"
              sx={{
                borderLeft: "3px solid #13715B",
                pl: 2,
                py: 0.5,
                my: 2,
                bgcolor: "#f0fdf4",
                borderRadius: "0 8px 8px 0",
                "& p": { mb: 0 },
              }}
            >
              {children}
            </Box>
          );
        },

        // Links
        a({ href, children }) {
          return (
            <Box
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "#13715B",
                textDecoration: "none",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {children}
            </Box>
          );
        },

        // Strong (bold)
        strong({ children }) {
          return (
            <Box component="strong" sx={{ fontWeight: 600, color: "#111827" }}>
              {children}
            </Box>
          );
        },

        // Emphasis (italic)
        em({ children }) {
          return (
            <Box component="em" sx={{ fontStyle: "italic" }}>
              {children}
            </Box>
          );
        },

        // Horizontal rule
        hr() {
          return (
            <Box
              component="hr"
              sx={{
                border: "none",
                borderTop: "1px solid #e5e7eb",
                my: 2,
              }}
            />
          );
        },

        // Tables
        table({ children }) {
          return (
            <Box
              sx={{
                overflowX: "auto",
                my: 2,
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                {children}
              </Box>
            </Box>
          );
        },
        thead({ children }) {
          return (
            <Box component="thead" sx={{ bgcolor: "#f9fafb" }}>
              {children}
            </Box>
          );
        },
        th({ children }) {
          return (
            <Box
              component="th"
              sx={{
                px: 2,
                py: 1.25,
                textAlign: "left",
                fontWeight: 600,
                color: "#374151",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {children}
            </Box>
          );
        },
        td({ children }) {
          return (
            <Box
              component="td"
              sx={{
                px: 2,
                py: 1.25,
                color: "#4b5563",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {children}
            </Box>
          );
        },

        // Pre (wrapper for code blocks)
        pre({ children }) {
          return <>{children}</>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Handle empty content
  if (!content) {
    return null;
  }

  // Fallback for plain text if markdown parsing fails
  const fallback = (
    <Typography
      variant="body2"
      sx={{
        color: "#374151",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.7,
      }}
    >
      {content}
    </Typography>
  );

  return (
    <MarkdownErrorBoundary fallback={fallback}>
      <MarkdownContent content={content} />
    </MarkdownErrorBoundary>
  );
}
