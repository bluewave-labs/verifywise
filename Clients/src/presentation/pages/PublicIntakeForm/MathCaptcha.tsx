import { useState, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getCaptcha } from "../../../application/repository/intakeForm.repository";

/**
 * Props for MathCaptcha component
 */
interface MathCaptchaProps {
  value: string;
  onChange: (value: string, token: string) => void;
  error?: string;
}

/**
 * Math CAPTCHA component for spam prevention
 */
export function MathCaptcha({ value, onChange, error }: MathCaptchaProps) {
  const [question, setQuestion] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCaptcha = async () => {
    setIsLoading(true);
    try {
      const response = await getCaptcha();
      if (response.data) {
        setQuestion(response.data.question);
        setToken(response.data.token);
        onChange("", response.data.token);
      }
    } catch (err) {
      console.error("Failed to load captcha:", err);
      setQuestion("Error loading captcha");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleRefresh = () => {
    loadCaptcha();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, token);
  };

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "#f9fafb",
        borderRadius: "4px",
        border: error ? "1px solid #ef4444" : "1px solid #d0d5dd",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: "#1f2937", fontSize: "13px" }}
        >
          Security check
        </Typography>
        <Tooltip title="Get new question">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{
              p: 0.5,
              color: "#6b7280",
              "&:hover": { color: "#13715B" },
            }}
          >
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f2937",
            backgroundColor: "#fff",
            px: 2,
            py: 1,
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {isLoading ? "Loading..." : question}
        </Typography>
        <Typography sx={{ fontSize: "16px", color: "#6b7280" }}>=</Typography>
        <TextField
          value={value}
          onChange={handleChange}
          placeholder="?"
          type="number"
          size="small"
          disabled={isLoading}
          error={!!error}
          sx={{
            width: 80,
            "& .MuiOutlinedInput-root": {
              fontSize: "16px",
              fontWeight: 600,
              textAlign: "center",
              "& fieldset": { borderColor: "#d0d5dd" },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": { borderColor: "#13715B" },
              "&.Mui-error fieldset": { borderColor: "#ef4444" },
            },
            "& input": {
              textAlign: "center",
            },
          }}
        />
      </Box>

      {error && (
        <Typography
          sx={{ color: "#ef4444", fontSize: "12px", mt: 1 }}
        >
          {error}
        </Typography>
      )}

      <Typography
        sx={{ color: "#9ca3af", fontSize: "11px", mt: 1.5 }}
      >
        Please solve this simple math problem to verify you are human
      </Typography>
    </Box>
  );
}

export default MathCaptcha;
