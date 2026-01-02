import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Paper, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";

/**
 * Submission state passed from PublicIntakeForm
 */
interface SubmissionState {
  submissionId: number;
  resubmissionToken: string;
  formName: string;
  submitterEmail: string;
}

/**
 * Success page shown after form submission
 */
export function SubmissionSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug, formSlug } = useParams<{ tenantSlug: string; formSlug: string }>();
  const state = location.state as SubmissionState | null;
  const [copied, setCopied] = useState(false);

  // If no state, redirect to form
  if (!state) {
    if (tenantSlug && formSlug) {
      navigate(`/intake/${tenantSlug}/${formSlug}`);
    }
    return null;
  }

  const resubmitUrl = `${window.location.origin}/intake/${tenantSlug}/${formSlug}?token=${state.resubmissionToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resubmitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmission = () => {
    navigate(`/intake/${tenantSlug}/${formSlug}?token=${state.resubmissionToken}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: "center",
          border: "1px solid #d0d5dd",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        {/* Success icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: "#16a34a" }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "#1f2937", mb: 1.5 }}
        >
          Submission received
        </Typography>

        {/* Description */}
        <Typography
          sx={{ color: "#6b7280", fontSize: "14px", mb: 3 }}
        >
          Thank you for submitting <strong>{state.formName}</strong>. We've sent a confirmation to{" "}
          <strong>{state.submitterEmail}</strong>.
        </Typography>

        {/* What's next */}
        <Box
          sx={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            p: 2.5,
            mb: 3,
            textAlign: "left",
          }}
        >
          <Typography
            sx={{ fontWeight: 600, color: "#1f2937", fontSize: "14px", mb: 1.5 }}
          >
            What happens next?
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: "#6b7280", fontSize: "13px" }}>
            <li style={{ marginBottom: "8px" }}>
              Your submission is now pending review by the team
            </li>
            <li style={{ marginBottom: "8px" }}>
              You'll receive an email when your submission is approved or if we need more information
            </li>
            <li>
              You can edit and resubmit using the link below until a decision is made
            </li>
          </Box>
        </Box>

        {/* Reference number */}
        <Box
          sx={{
            backgroundColor: "#f0fdf4",
            borderRadius: "4px",
            p: 2,
            mb: 3,
          }}
        >
          <Typography sx={{ color: "#6b7280", fontSize: "12px", mb: 0.5 }}>
            Reference number
          </Typography>
          <Typography sx={{ fontWeight: 600, color: "#1f2937", fontSize: "18px" }}>
            #{state.submissionId}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditSubmission}
            sx={{
              height: 40,
              borderColor: "#d0d5dd",
              color: "#1f2937",
              textTransform: "none",
              fontSize: "13px",
              "&:hover": {
                borderColor: "#13715B",
                backgroundColor: "#f0fdf4",
              },
            }}
          >
            Edit and resubmit
          </Button>
          <Button
            variant="text"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyLink}
            sx={{
              height: 40,
              color: "#6b7280",
              textTransform: "none",
              fontSize: "13px",
              "&:hover": {
                backgroundColor: "#f9fafb",
              },
            }}
          >
            {copied ? "Link copied!" : "Copy resubmission link"}
          </Button>
        </Box>

        {/* Footer */}
        <Typography
          sx={{
            color: "#9ca3af",
            fontSize: "12px",
            mt: 3,
          }}
        >
          Powered by VerifyWise
        </Typography>
      </Paper>
    </Box>
  );
}

export default SubmissionSuccess;
