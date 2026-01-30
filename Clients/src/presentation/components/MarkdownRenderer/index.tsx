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

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Custom code block component with copy button
const CodeBlock = ({
  language,
  children,
}: {
  language: string | undefined;
  children: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
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
          {language || "text"}
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
      <SyntaxHighlighter
        language={language || "text"}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: "16px",
          fontSize: "13px",
          lineHeight: 1.6,
          background: "#fafafa",
        }}
        codeTagProps={{
          style: {
            fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </Box>
  );
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks and inline code
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;
          const codeString = String(children).replace(/\n$/, "");

          if (isInline) {
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
                {...props}
              >
                {children}
              </Box>
            );
          }

          return <CodeBlock language={match?.[1]} children={codeString} />;
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

        // Pre (wrapper for code blocks - we handle this in code component)
        pre({ children }) {
          return <>{children}</>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
