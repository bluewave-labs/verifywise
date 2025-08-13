import { Stack, Grid, Typography } from "@mui/material";
import Field from "../Inputs/Field";
import Select from "../Inputs/Select";
import DatePicker from "../Inputs/Datepicker";
import dayjs from "dayjs";
import ReviewerMultiSelect from "../../vw-v2-components/Selects/ReviewerSelect";

export interface FormData {
  title: string;
  status: string;
  tags: string[];
  nextReviewDate?: string;
  assignedReviewers: string[];
  content: any;
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  tags: string[];
}

const statuses: FormData["status"][] = [
  "Draft",
  "In review",
  "Approved",
  "Published",
  "Archived",
];

const PolicyForm: React.FC<Props> = ({ formData, setFormData }) => {

  return (
    <Stack spacing={4}>
      {/* Header Label */}
      <Typography variant="subtitle1" color="textSecondary">
        Policy Details
      </Typography>

      {/* Row 1: Title + Status */}
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Field
            label="Title"
            isRequired
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Select
            id="policy-status"
            label="Status"
            isRequired
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => {
                const statusValue = e.target.value;
                if (typeof statusValue === 'string') {
                  return { ...prev, status: statusValue };
                } else {
                  return prev;
                }
              })
            }
            items={statuses.map((s) => ({ _id: s, name: s }))}
            getOptionValue={(item) => item._id}
          />
        </Grid>
      </Grid>

      {/* Row 2: Next Review Date + Assigned Reviewers */}
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <DatePicker
            label="Next review"
            date={
              formData.nextReviewDate
                ? dayjs(formData.nextReviewDate)
                : null
            }
            handleDateChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                nextReviewDate: value ? dayjs(value).format("YYYY-MM-DD") : "",
              }))
            }
          />
        </Grid>
        <Grid item xs={6}>
          <ReviewerMultiSelect
            selected={formData.assignedReviewers}
            setSelected={(ids) =>
              setFormData((prev) => ({ ...prev, assignedReviewers: ids }))
            }
          />
        </Grid>
      </Grid>

      {/* Row 3: Tags Full Width */}
<Grid container spacing={3}>
  <Grid item xs={12}>
    <Field
      label="Tags"
      value={formData.tags.join(", ")}
      onChange={(e) => {
        const tagsArray = e.target.value.split(",").map((t) => t.trim());
        setFormData((prev) => ({ ...prev, tags: tagsArray }));
      }}
      placeholder="Comma-separated tags"
    />
  </Grid>
</Grid>
    </Stack>
  );
};

export default PolicyForm;
