import { styled } from "@mui/material/styles";
import { Dialog, DialogContent } from "@mui/material";

export const StyledDialog = styled(Dialog)(() => ({
  "& .MuiDialog-paper": {
    width: "384px",
    height: "338px",
    borderRadius: "4px",
    
  },
}));

export const StyledDialogContent = styled(DialogContent)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "32px",
  height: "calc(338px - 32px)",
  overflow: "visible",
}));

export const Container = styled("div")({
  width: "100%",
  height: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const DragDropArea = styled("div")({
  width: "320px",
  height: "190px",
  border: "1px dashed #D1D5DB",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  gap: "8px",
transition:"height 0.3s ease",
  "& .uppy-Container": {
    display: "none !important",
  },

  //remove default uppy container while maintaining drag drop functionality
});

export const Icon = styled("img")({
  width: "40px",
  height: "40px",
  marginBottom:"8px",
});

export const ButtonWrapper = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
  marginTop:"16px",
});
