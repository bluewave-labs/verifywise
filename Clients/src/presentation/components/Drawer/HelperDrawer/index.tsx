import React, { useMemo } from "react";
import {
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Divider,
  Box,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { HelperDrawerProps } from "./drawertype";
import DOMPurify from "dompurify";

const HelperDrawer: React.FC<HelperDrawerProps> = ({
  pageTitle,
  helpContent,
  isOpen,
  onClose,
}) => {
  const theme = useTheme();

  const sanitizedContent = useMemo(
    () =>
      DOMPurify.sanitize(helpContent, {
        ALLOWED_TAGS: [
          "div",
          "h2",
          "h3",
          "p",
          "br",
          "strong",
          "ul",
          "ol",
          "li",
        ],
        ALLOWED_ATTR: [],
      }),
    [helpContent]
  );

  return (
    <>
      <IconButton
        onClick={() => (!isOpen ? onClose() : null)}
        aria-label="Open help information"
        size="large"
        sx={{
          position: "absolute",
          right: theme.spacing(1),
          top: theme.spacing(1),
          color: "#344054",
          backgroundColor: "transparent",
          paddingBottom: theme.spacing(10),
        }}
      >
        <InfoOutlinedIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        sx={{
          width: 600,
          margin: 0,
          "& .MuiDrawer-paper": {
            width: 600,
            margin: 0,
            borderRadius: 0,
            overflowX: "hidden",
          },
        }}
      >
        <Stack
          sx={{
            width: 600,
          }}
        >
          <Stack
            sx={{
              width: 600,
              padding: "15px 20px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography fontSize={15} fontWeight={700}>
              {pageTitle}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider />

          <Stack
            sx={{
              padding: "15px 20px",
              gap: "15px",
            }}
          >
            <Box
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(sanitizedContent),
              }}
              sx={{
                maxWidth: "100%",
                wordWrap: "break-word",
                "& h3": {
                  fontSize: "15px",
                  fontWeight: 600,
                  mt: 0,
                  mb: 1,
                  color: "#344054",
                },
                "& p": {
                  fontSize: "13px",
                  lineHeight: 1.5,
                  mb: 2,
                  color: "#344054",
                  mt: 0,
                },
                "& strong": {
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#344054",
                },
                "& div": {
                  fontSize: "13px",
                  color: "#344054",
                },
                "& ul": {
                  fontSize: "13px",
                  color: "#344054",
                  pl: 2,
                  mb: 2,
                  mt: 0,
                },
                "& ol": {
                  fontSize: "13px",
                  color: "#344054",
                  pl: 2,
                  mb: 2,
                  mt: 0,
                },
                "& li": {
                  fontSize: "13px",
                  color: "#344054",
                  mb: 0.5,
                  lineHeight: 1.5,
                },
                "& section": {
                  mb: 2,
                },
              }}
            />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default HelperDrawer;
