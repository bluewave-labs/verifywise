import React from "react";
import { Stack, Typography, Button } from "@mui/material";
import Uppy from "@uppy/core";
import { DragDrop } from "@uppy/react";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import UploadSmallIcon from "../../assets/icons/file-upload.svg"; 

const FileUploadComponent: React.FC = () => {
  const uppy = new Uppy({
    restrictions: {
      maxNumberOfFiles: 1,
      allowedFileTypes: [".pdf"],
      maxFileSize: 50 * 1024 * 1024,
    },
    autoProceed: false,
  });

  uppy.on("file-added", (file) => {
    console.log("File added:", file);
  });

  return (
    <Stack
      spacing={2}
      sx={{
        width: "384px",
        height: "338px",
        
        display:'flex',
        flexDirection:'column',
        justifyContent:'space-between',
        padding: "32px",
      
      }}
    >
     {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          fontSize: "16px",
          color: "#374151",
          paddingBottom: "10px",
        }}
      >
        Upload a new file 
      </Typography>
     {/* Drag-and-Drop Area */}
      <Stack
        spacing={1}
        sx={{
          width: "320px",
          height: "190px",
          border: "1px dashed #D1D5DB",
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          borderRadius: "8px",
          backgroundColor: "#FFFFFF", 
          
        }}
      >
        {/* Small Upload Icon */}
        
        <Stack
          component="img"
          src={UploadSmallIcon}
          alt="Upload Icon"
          sx={{
            width: "40px",
            height: "40px",
          }}
        />
        {/* Captions */}
        <Typography
          variant="body2"
          sx={{
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          
          <span
            style={{
              color: "#3B82F6",
              cursor: "pointer",
            }}
          >
            Click to upload 
          </span>{" "}
          or drag and drop 
        </Typography>
        
        <Typography
          variant="caption"
          sx={{
            fontSize: "12px",
            color: "#6B7280",
          }}
        >
          (maximum size: 50 MB) 
        </Typography>
        {/* Hidden DragDrop Component */}
        <Stack
          sx={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 0,
          }}
        >
          
          <DragDrop
            uppy={uppy}
            locale={{
              strings: {
                dropHereOr: "Click to upload or drag and drop",
              },
              pluralize: (count: number) => (count === 1 ? "file" : "files"),
            } as any}
          />
          
        </Stack>
        
      </Stack>
      {/* Supported Formats */}
      
      <Typography
        variant="caption"
        sx={{
          fontSize: "12px",
          color: "#6B7280",
        }}
      >
       Supported formats: PDF 
      </Typography>
      {/* Upload Button Aligned to the Right */}
      
      <Stack
        direction="row"
        justifyContent="flex-end" 
      >
        
        <Button
          variant="contained"
          sx={{
            width: "120px",
            height: "40px",
            backgroundColor: "#3B82F6",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "8px",
          }}
          onClick={() => uppy.upload()}
        >
         Upload 
        </Button>
       
      </Stack>
      
    </Stack>
  );
};

export default FileUploadComponent;
