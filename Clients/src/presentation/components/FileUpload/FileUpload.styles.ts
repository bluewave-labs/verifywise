import { styled } from "@mui/material/styles";

export const Container = styled("div")({
  width: "384px",
  height: "338px",
  padding: "32px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  backgroundColor: "#F9FAFB",
});

export const DragDropArea = styled("div")({
  width: "320px",
  height: "190px",
  border: "1px dashed #D1D5DB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  position: "relative",
});

export const Icon = styled("img")({
  width: "40px",
  height: "40px",
});

export const ButtonWrapper = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
});
