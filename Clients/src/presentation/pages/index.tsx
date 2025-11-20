import { Stack, Typography, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Uploader from "../components/Uploader";

const Playground = () => {
  const theme = useTheme();

  const handleUploadComplete = (files: any[]) => {
    console.log("Upload completed:", files);
    // You can handle the completed upload here
    // For example, send to backend, update state, etc.
  };

  const handleUploadProgress = (file: any, progress: number) => {
    console.log(`Upload progress for ${file.name}: ${progress}%`);
  };

  const handleUploadError = (file: any, error: string) => {
    console.error(`Upload error for ${file.name}:`, error);
  };

  return (
    <Stack
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        gap: 3,
        backgroundColor: theme.palette.background.alt,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        File Uploader Demo
      </Typography>

      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 800,
          p: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
    
        <Uploader
          acceptedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt', '.csv']}
          maxFileSize={5 * 1024 * 1024} // 5MB
          maxFiles={5}
          multiple={true}
          onUploadComplete={handleUploadComplete}
          onUploadProgress={handleUploadProgress}
          onUploadError={handleUploadError}
          showPreview={true}
          uploadUrl="/api/upload"
          uploadHeaders={{
            'Authorization': 'Bearer your-token-here',
            'X-Custom-Header': 'custom-value'
          }}
        />
      </Paper>
    </Stack>
  );
};

export default Playground;
