// AlertBody.tsx
import React, { useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface AlertBodyProps {
  body: string;
  textColor: string;
}

const AlertBody: React.FC<AlertBodyProps> = ({ body, textColor }) => {
  const [copied, setCopied] = useState(false);
  const linkMatch = body.match(/https?:\/\/[^\s]+/);
  const link = linkMatch ? linkMatch[0] : null;

  // Limit link to 35 characters
  const limitedLink = link && link.length > 35 ? link.substring(0, 35) + "..." : link;

  const handleCopy = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Typography sx={{ fontWeight: 400, color: textColor }}>
      {link ? (
        <>
          {body.split(link)[0]}
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            {limitedLink}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              sx={{ paddingLeft: 3 }}
            >
              {copied ? (
                <Typography variant="caption" sx={{ color: textColor }}>
                  Copied!
                </Typography>
              ) : (
                <ContentCopyIcon sx={{ fontSize: 16, color: textColor }} />
              )}
            </IconButton>
          </Box>
          {body.split(link)[1]}
        </>
      ) : (
        body
      )}
    </Typography>
  );
};

export default AlertBody;
