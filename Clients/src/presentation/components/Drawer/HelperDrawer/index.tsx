import React from "react";
import {
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { HelperDrawerProps } from "./drawertype";

const HelperDrawer: React.FC<HelperDrawerProps> = ({
  pageTitle,
  helpContent,
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
            overflowX: "hidden",
          },
        }}
      >
        <Stack
          sx={{
            width: "100%",
            height: "100%",
          }}
        >
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
            {/* Help Content */}
            <div
              dangerouslySetInnerHTML={{ __html: helpContent }}
              style={{
                maxWidth: "100%", 
                wordWrap: "break-word", 
              }}
            />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default HelperDrawer;
