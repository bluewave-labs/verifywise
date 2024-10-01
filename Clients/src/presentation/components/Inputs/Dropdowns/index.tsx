import { Grid, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import Select from "../Select";
import DatePicker from "../Datepicker";
import Field from "../Field";

const DropDowns = () => {
  const [status, setStatus] = useState<string | number>("");
  const [approver, setApprover] = useState<string | number>("");
  const [riskReview, setRiskReview] = useState<string | number>("");
  const [owner, setOwner] = useState<string | number>("");
  const [reviewer, setReviewer] = useState<string | number>("");
  const theme = useTheme();

  const inputStyles = { width: 200, height: 34 };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={4}>
          <Select
            id="status"
            label="Status:"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            items={[
              { _id: 10, name: "Waiting" },
              { _id: 20, name: "In progress" },
              { _id: 30, name: "Done" },
            ]}
            sx={inputStyles}
          />
        </Grid>
        <Grid item xs={4}>
          <Select
            id="Approver"
            label="Approver:"
            value={approver}
            onChange={(e) => setApprover(e.target.value)}
            items={[
              { _id: 10, name: "Option 1" },
              { _id: 20, name: "Option 2" },
              { _id: 30, name: "Option 3" },
            ]}
            sx={inputStyles}
          />
        </Grid>
        <Grid item xs={4}>
          <Select
            id="Risk review"
            label="Risk review:"
            value={riskReview}
            onChange={(e) => setRiskReview(e.target.value)}
            items={[
              { _id: 10, name: "Acceptable risk" },
              { _id: 20, name: "Residual risk" },
              { _id: 30, name: "Unacceptable risk" },
            ]}
            sx={inputStyles}
          />
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={4}>
          <Select
            id="Owner"
            label="Owner:"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            items={[
              { _id: 10, name: "Option 1" },
              { _id: 20, name: "Option 2" },
              { _id: 30, name: "Option 3" },
            ]}
            sx={inputStyles}
          />
        </Grid>
        <Grid item xs={4}>
          <Select
            id="Reviewer"
            label="Reviewer:"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            items={[
              { _id: 10, name: "Option 1" },
              { _id: 20, name: "Option 2" },
              { _id: 30, name: "Option 3" },
            ]}
            sx={inputStyles}
          />
        </Grid>
        <Grid item xs={4}>
          <DatePicker
            label="Due Date:"
            sx={{ width: 129, height: 34, flexDirection: "row-reverse" }}
          />
        </Grid>
      </Grid>

      <Typography
        fontSize={13}
        fontWeight={400}
        sx={{ textAlign: "left", mt: 4, ml: 2 }}
      >
        Implementation details:
      </Typography>
      <Grid container spacing={0} sx={{ mt: 3 }}>
        <Grid
          item
          xs={12}
          sx={{
            height: 73,
            borderRadius: theme.shape.borderRadius,
            "& .MuiInputBase-root": {
              height: "73px", 
            },
            "& .MuiOutlinedInput-input": {
              padding: "10px", 
            },
          }}
        >
          <Field type="description" />
        </Grid>
      </Grid>
    </>
  );
};

export default DropDowns;
