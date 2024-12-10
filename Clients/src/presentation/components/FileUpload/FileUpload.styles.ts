import { styled } from "@mui/material/styles";

export const Container = styled("div")({
  width: "384px",
  height: "240px",
  padding: "32px",
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
  position: "relative",
  gap:2,

  "& .uppy-Container": {
    display: "none !important",
  },
 
  //remove default uppy container while maintaining drag drop functionality
});

export const Icon = styled("img")({
  width: "40px",
  height: "40px",
});

export const ButtonWrapper = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
});
