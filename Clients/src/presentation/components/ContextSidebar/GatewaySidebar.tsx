import { FC } from "react";
import { Stack, Typography, Box } from "@mui/material";
import { Network } from "lucide-react";

const GatewaySidebar: FC = () => {
  return (
    <Stack
      sx={{
        width: "260px",
        minWidth: "260px",
        maxWidth: "260px",
        flexShrink: 0,
        height: "100vh",
        borderRight: "1px solid #d0d5dd",
        backgroundColor: "#fff",
        padding: "16px",
        position: "sticky",
        top: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          color: "#344054",
          marginBottom: "16px",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        LLM Gateway
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: "12px",
          color: "#667085",
        }}
      >
        <Network size={32} strokeWidth={1} />
        <Typography
          variant="body2"
          sx={{
            color: "#667085",
            textAlign: "center",
            fontSize: "13px",
          }}
        >
          Coming soon
        </Typography>
      </Box>
    </Stack>
  );
};

export default GatewaySidebar;
