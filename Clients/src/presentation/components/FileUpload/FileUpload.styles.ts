import { styled } from "@mui/material/styles";
import { Dialog, DialogContent } from "@mui/material";

export const StyledDialog = styled(Dialog, {
  shouldForwardProp: (prop) => prop !== "modalWidth" && prop !== "modalHeight",
})<{ modalWidth?: number; modalHeight?: number }>(
  ({ modalWidth = 384, modalHeight = 338 }) => ({
    ".MuiDialog-paper": {
      width: `${modalWidth}px`,
      height: `${modalHeight}px`,
      borderRadius: "4px",
      overflow: "hidden",
      maxHeight: "90vh",
      maxWidth: "90vw",
      margin:"0 ",
      transition: "all 0.3s ease",
      padding:"0"
    
    },
   
  })
);

export const StyledDialogContent = styled(DialogContent)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "32px",
  overflow: "visible",
  boxSizing:"border-box",
overflowY:"auto",
width:"100%",
height:"100%"
}));

export const Container = styled("div")({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const DragDropArea = styled("div", {
shouldForwardProp: (prop) => prop !== "uploadedFilesCount",
})<{ uploadedFilesCount?: number }>(({ uploadedFilesCount = 0 }) => ({
width: `${320 + Math.min(uploadedFilesCount * 50, 300)}px`,
height: `${190 + Math.min(uploadedFilesCount * 40, 200)}px`,
border: "1px dashed #D1D5DB",
display: "flex",
alignItems: "center",
flexDirection: "column",
justifyContent: "center",
borderRadius: "8px",
backgroundColor: "#FFFFFF",

transition: "all 0.3s ease",
overflow: "hidden",
margin: "0 auto", 
boxSizing: "border-box", 
 "& .uppy-Container": {
    display: "none !important",
  //remove default uppy container while maintaining drag drop functionality
}
}));
 

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
