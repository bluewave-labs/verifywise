import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import dayjs from "dayjs";

// Types
export interface IModelForm {
  id?: number;
  model: string;
  version: string;
  approver: string;
  capabilities: string[];
  security_assessments: "Yes" | "No";
  status: "Approved" | "Pending" | "Restricted" | "Blocked";
  status_date: number;
}

interface AddEditNewModelProps {
  open: boolean;
  initialData?: Partial<IModelForm>;
  approverOptions: string[];
  onClose: () => void;
  onSave: (data: IModelForm) => void;
}

const CAPABILITIES = [
  "Vision",
  "Caching",
  "Tools",
  "Code",
  "Multimodal",
  "Audio",
  "Video",
];

const STATUS_OPTIONS = [
  "Approved",
  "Pending",
  "Restricted",
  "Blocked",
];

export const AddEditNewModel: React.FC<AddEditNewModelProps> = ({
  open,
  initialData,
  approverOptions,
  onClose,
  onSave,
}) => {
  // Form state
  const [form, setForm] = useState<IModelForm>({
    id: initialData?.id,
    model: initialData?.model || "",
    version: initialData?.version || "",
    approver: initialData?.approver || "",
    capabilities: initialData?.capabilities || [],
    security_assessments: initialData?.security_assessments || "No",
    status: initialData?.status || "",
    status_date: initialData?.status_date || dayjs().startOf("day").valueOf(),
  });

  const [touched, setTouched] = useState<{ [K in keyof IModelForm]?: boolean }>({});
  const [errors, setErrors] = useState<{ [K in keyof IModelForm]?: string }>({});

  // Validation
  const validate = (field: keyof IModelForm, value: any) => {
    switch (field) {
      case "model":
        if (!value) return "Provider/model is required";
        break;
      case "approver":
        if (!value) return "Approver is required";
        break;
      case "status":
        if (!value) return "Status is required";
        break;
      case "capabilities":
        if (!value || value.length === 0) return "Select at least one capability";
        break;
      case "status_date":
        if (!value) return "Status date is required";
        break;
      default:
        return "";
    }
    return "";
  };

  // Handle field change
  const handleChange = (
    field: keyof IModelForm,
    value: any
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
  };

  // Handle capabilities toggle
  const handleCapabilities = (
    event: React.MouseEvent<HTMLElement>,
    newCapabilities: string[]
  ) => {
    handleChange("capabilities", newCapabilities);
  };

  // Handle date change (simulate date picker)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = dayjs(e.target.value).startOf("day").valueOf();
    handleChange("status_date", date);
  };

  // Handle Save
  const handleSave = () => {
    // Validate all fields
    const newErrors: typeof errors = {};
    (["model", "approver", "status", "capabilities", "status_date"] as (keyof IModelForm)[]).forEach((field) => {
      const err = validate(field, form[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    setTouched({
      model: true,
      approver: true,
      status: true,
      capabilities: true,
      status_date: true,
    });
    if (Object.keys(newErrors).length === 0) {
      onSave(form);
    }
  };

  // Render
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 24, color: "#344054", pb: 0 }}>
        Add a new model
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 24, top: 24, color: "#98A2B3" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={500} mb={1.5}>
              Provider/model
            </Typography>
            <TextField
              fullWidth
              placeholder="eg. OpenAI GPT-4"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              error={!!(touched.model && errors.model)}
              helperText={touched.model && errors.model}
              size="medium"
              sx={{ background: "#F9FAFB" }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={500} mb={1.5}>
              Version (if applicable)
            </Typography>
            <TextField
              fullWidth
              value={form.version}
              onChange={(e) => handleChange("version", e.target.value)}
              size="medium"
              sx={{ background: "#F9FAFB" }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={500} mb={1.5}>
              Approver
            </Typography>
            <FormControl fullWidth error={!!(touched.approver && errors.approver)}>
              <Select
                displayEmpty
                value={form.approver}
                onChange={(e) => handleChange("approver", e.target.value)}
                sx={{ background: "#F9FAFB" }}
                renderValue={(selected) =>
                  selected ? selected : <span style={{ color: "#98A2B3" }}>Select approver</span>
                }
              >
                <MenuItem value="" disabled>
                  Select approver
                </MenuItem>
                {approverOptions.map((option) => (
                  <MenuItem value={option} key={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {touched.approver && errors.approver && (
                <FormHelperText>{errors.approver}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={500} mb={1.5}>
              Status
            </Typography>
            <FormControl fullWidth error={!!(touched.status && errors.status)}>
              <Select
                displayEmpty
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                sx={{ background: "#F9FAFB" }}
                renderValue={(selected) =>
                  selected ? selected : <span style={{ color: "#98A2B3" }}>Select status</span>
                }
              >
                <MenuItem value="" disabled>
                  Select status
                </MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem value={option} key={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {touched.status && errors.status && (
                <FormHelperText>{errors.status}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={500} mb={1.5}>
              Status date
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={dayjs(form.status_date).format("YYYY-MM-DD")}
              onChange={handleDateChange}
              InputProps={{
                startAdornment: (
                  <CalendarTodayOutlinedIcon sx={{ mr: 1, color: "#98A2B3" }} />
                ),
              }}
              sx={{ background: "#F9FAFB" }}
              error={!!(touched.status_date && errors.status_date)}
              helperText={touched.status_date && errors.status_date}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <Typography fontWeight={500} mb={1.5}>
              Capabilities
            </Typography>
            <ToggleButtonGroup
              value={form.capabilities}
              onChange={handleCapabilities}
              aria-label="capabilities"
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {CAPABILITIES.map((cap) => (
                <ToggleButton
                  key={cap}
                  value={cap}
                  sx={{
                    border: "1px solid #D0D5DD",
                    borderRadius: 2,
                    px: 2.5,
                    py: 1,
                    color: "#344054",
                    background: form.capabilities.includes(cap)
                      ? "#F3F4F6"
                      : "#fff",
                    "&.Mui-selected": {
                      background: "#E0E7FF",
                      color: "#344054",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {cap}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {touched.capabilities && errors.capabilities && (
              <Typography color="error" fontSize={13} mt={1}>
                {errors.capabilities}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={12} mt={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography fontWeight={500}>Security assessment</Typography>
              <Switch
                checked={form.security_assessments === "Yes"}
                onChange={(_, checked) =>
                  handleChange("security_assessments", checked ? "Yes" : "No")
                }
                color="primary"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ pr: 4, pb: 3, pt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{
            minWidth: 120,
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            background: "#3366FF",
            boxShadow: "none",
            textTransform: "none",
            "&:hover": { background: "#254EDB" },
          }}
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditNewModel