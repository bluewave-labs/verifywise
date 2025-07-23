import React from "react";
import { Drawer, IconButton, Stack, Typography, useTheme } from "@mui/material";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import CloseIcon from "@mui/icons-material/Close";
import { HelperDrawerProps } from "./drawertype";

const HelperDrawer: React.FC<HelperDrawerProps> = ({
  title,
  description,
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
        <Stack spacing={2} position="relative">
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
          <Typography variant="h6" component="h2" sx={{mt:1}}>{title}</Typography>
          <Typography variant="body1">{description}</Typography>
        </Stack>
      </Drawer>
    </>
  );
};

export default HelperDrawer;
