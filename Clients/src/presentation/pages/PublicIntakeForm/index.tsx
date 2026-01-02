import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { MathCaptcha } from "./MathCaptcha";
import {
  getPublicForm,
  submitPublicForm,
  FormSchema,
  IntakeEntityType,
} from "../../../application/repository/intakeForm.repository";

/**
 * Public form data structure
 */
interface PublicFormData {
  id: number;
  name: string;
  description: string;
  slug: string;
  entityType: IntakeEntityType;
  schema: FormSchema;
  submitButtonText: string;
}

/**
 * Public intake form page - accessible without authentication
 */
export function PublicIntakeForm() {
  const { tenantSlug, formSlug } = useParams<{ tenantSlug: string; formSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resubmissionToken = searchParams.get("token") || undefined;

  // State
  const [formData, setFormData] = useState<PublicFormData | null>(null);
  const [previousData, setPreviousData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Form state
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  // Submitter info
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Load form
  useEffect(() => {
    if (tenantSlug && formSlug) {
      loadForm();
    }
  }, [tenantSlug, formSlug, resubmissionToken]);

  const loadForm = async () => {
    if (!tenantSlug || !formSlug) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getPublicForm(tenantSlug, formSlug, resubmissionToken);
      if (response.data) {
        setFormData(response.data.form);
        if (response.data.previousData) {
          setPreviousData(response.data.previousData);
          // Pre-fill form with previous data
          reset(response.data.previousData);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load form:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setError("This form is no longer available or has expired.");
      } else if (errorMessage.includes("expired")) {
        setError("This form has expired and is no longer accepting submissions.");
      } else {
        setError("Failed to load form. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaChange = (value: string, token: string) => {
    setCaptchaValue(value);
    setCaptchaToken(token);
    setCaptchaError(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!tenantSlug || !formSlug || !formData) return;

    // Validate email
    if (!submitterEmail.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(submitterEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);

    // Validate captcha
    if (!captchaValue.trim()) {
      setCaptchaError("Please solve the math problem");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitPublicForm(tenantSlug, formSlug, {
        formData: data,
        submitterEmail,
        submitterName: submitterName || undefined,
        captchaToken,
        captchaAnswer: parseInt(captchaValue),
        resubmissionToken,
      });

      if (response.data) {
        // Navigate to success page with submission info
        navigate(`/intake/${tenantSlug}/${formSlug}/success`, {
          state: {
            submissionId: response.data.submissionId,
            resubmissionToken: response.data.resubmissionToken,
            formName: formData.name,
            submitterEmail,
          },
        });
      }
    } catch (err: unknown) {
      console.error("Failed to submit form:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("captcha") || errorMessage.includes("incorrect")) {
        setCaptchaError("Incorrect answer. Please try again.");
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        setError("Too many submissions. Please try again later.");
      } else {
        setError("Failed to submit form. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  // Error state
  if (error && !formData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
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
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1f2937", mb: 2 }}
          >
            Form unavailable
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: "14px" }}>
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!formData) {
    return null;
  }

  const sortedFields = [...formData.schema.fields].sort((a, b) => a.order - b.order);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #d0d5dd",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
          >
            {formData.name}
          </Typography>
          {formData.description && (
            <Typography sx={{ color: "#6b7280", fontSize: "14px" }}>
              {formData.description}
            </Typography>
          )}
          {previousData && (
            <Alert
              severity="info"
              sx={{ mt: 2, fontSize: "13px" }}
            >
              Your previous submission data has been pre-filled. You can update and resubmit.
            </Alert>
          )}
        </Paper>

        {/* Form */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            p: 3,
            border: "1px solid #d0d5dd",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          {/* Form fields */}
          {sortedFields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              control={control}
              errors={errors}
            />
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Submitter info */}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: "#1f2937", mb: 2, fontSize: "14px" }}
          >
            Your contact information
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            <TextField
              label="Email"
              type="email"
              required
              value={submitterEmail}
              onChange={(e) => {
                setSubmitterEmail(e.target.value);
                setEmailError(null);
              }}
              error={!!emailError}
              helperText={emailError || "We'll send you updates about your submission"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "14px",
                  "& fieldset": { borderColor: "#d0d5dd" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#13715B" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: "14px",
                  "&.Mui-focused": { color: "#13715B" },
                },
              }}
            />
            <TextField
              label="Name (optional)"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "14px",
                  "& fieldset": { borderColor: "#d0d5dd" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#13715B" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: "14px",
                  "&.Mui-focused": { color: "#13715B" },
                },
              }}
            />
          </Box>

          {/* CAPTCHA */}
          <Box sx={{ mb: 3 }}>
            <MathCaptcha
              value={captchaValue}
              onChange={handleCaptchaChange}
              error={captchaError || undefined}
            />
          </Box>

          {/* Submit button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              height: 44,
              backgroundColor: "#13715B",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#0f5c49" },
              "&:disabled": { backgroundColor: "#9ca3af" },
            }}
          >
            {isSubmitting ? "Submitting..." : formData.submitButtonText}
          </Button>
        </Paper>

        {/* Footer */}
        <Typography
          sx={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "12px",
            mt: 3,
          }}
        >
          Powered by VerifyWise
        </Typography>
      </Box>
    </Box>
  );
}

export default PublicIntakeForm;
