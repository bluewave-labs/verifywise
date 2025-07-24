import React from "react";
import { Drawer, IconButton, Stack, Typography, useTheme, Divider, Box } from "@mui/material";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
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
        onClick={onClose}
        aria-label="Open help information"
        color="primary"
        size="large"
      >
        <InfoOutlineIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        sx={{
          "& .MuiDrawer-paper": {
            width: "400px",
            padding: theme.spacing(3),
            boxSizing: "border-box",
          },
        }}
      >
        <Stack spacing={3} position="relative">
          <IconButton
            onClick={onClose}
            aria-label="Close help drawer"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
          {/* Page Title */}
          <Typography
            variant="h5"
            component="h1"
            sx={{ mt: 1, fontWeight: 600 }}
          >
            {pageTitle}
          </Typography>
          {/* Overview Section */}
          <Box>
            <Typography variant="body1" color="text.secondary">
              {overview}
            </Typography>
          </Box>

          <Divider />

          {/* Help Sections */}
          <Stack spacing={3}>
            {sections.map((section, index) => (
              <Box key={index}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  {section.title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {section.content}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default HelperDrawer;
