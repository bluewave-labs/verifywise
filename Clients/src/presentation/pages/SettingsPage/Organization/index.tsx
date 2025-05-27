import { Stack, useTheme } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { useState } from "react";

const Organization = () => {
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const theme = useTheme();

  const handleSave = () => {
    console.log("Organization Name:", organizationName);
  };

  return (
    <Stack className="organization-container" sx={{ mt: 3, maxWidth: 960 }}>
      <Stack
        className="organization-form"
        sx={{
          pt: theme.spacing(20),
        }}
      >
        <Stack sx={{ width: { xs: "100%", md: "40%" } }}>
          <Field
            id="Organization name"
            label="Organization name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
        </Stack>
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <VWButton
          variant="contained"
          text="Save"
          sx={{
            backgroundColor: "#13715B",
            border: isSaveDisabled
              ? "1px solid rgba(0, 0, 0, 0.26)"
              : "1px solid #13715B",
            gap: 2,
          }}
          icon={<SaveIcon />}
          onClick={handleSave}
          isDisabled={isSaveDisabled}
        />
      </Stack>
    </Stack>
  );
};

export default Organization;
