import React from "react";
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

const HelperDrawer: React.FC<HelperDrawerProps> = ({
  pageTitle,
  overview,
  sections,
  isOpen,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <>
      <IconButton
        onClick={() => (!isOpen ? onClose() : null)}
        aria-label="Open help information"
        color="primary"
        size="large"
        sx={{
          position: "absolute",
          right: theme.spacing(2),
          top: theme.spacing(2),
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
          },
        }}
      >
        <Stack sx={{ width: 600 }}>
          <Stack
            sx={{
              width: "100%",
              padding: "15px 20px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Page Title */}
            <Typography
              variant="h5"
              component="h1"
              sx={{ mt: 1, fontWeight: 600 }}
            >
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
            {/* Overview Section */}
            <Stack
              sx={{
                border: `1px solid #eee`,
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <Typography fontSize={13}>{overview}</Typography>
            </Stack>

            {/* Help Sections */}
            <Stack spacing={3}>
              {sections.map((section, index) => (
                <Box key={index}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: "5px",
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "text.secondary",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {section.content}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default HelperDrawer;
