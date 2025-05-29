import { Stack, useTheme, Typography, Box, Divider } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { useState, useRef, useCallback, ChangeEvent } from "react";
import Avatar from "../../../components/Avatar/VWAvatar/index";

interface OrganizationData {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

const Organization = () => {
  const [isSaveDisabled, _] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationLogo, setOrganizationLogo] = useState<string>(
    "/placeholder.svg?height=80&width=80"
  );
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = () => {
    console.log("Organization Name:", organizationName);
    console.log("Organization Logo:", organizationLogo);
  };

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        const newLogoUrl = URL.createObjectURL(file);
        setOrganizationLogo(newLogoUrl);
      }
    },
    []
  );

  const handleUpdateLogo = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteLogo = useCallback((): void => {
    setOrganizationLogo("/placeholder.svg?height=80&width=80");
  }, []);

  const organizationData: OrganizationData = {
    firstname: organizationName,
    lastname: "",
    email: "",
    pathToImage: organizationLogo,
  };

  return (
    <Stack className="organization-container" sx={{ mt: 3, maxWidth: 790 }}>
      <Stack
        className="organization-form"
        sx={{
          pt: theme.spacing(20),
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            mb: 3,
            width: "100%",
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
            <VWButton
              variant="contained"
              text="Save"
              sx={{
                width: 90,
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
          <Box
            sx={{
              textAlign: { xs: "left", md: "center" },
              pb: theme.spacing(10),
            }}
          >
            <Stack
              direction="column"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Typography
                fontWeight="600"
                variant="subtitle1"
                color="#344054"
                pb={theme.spacing(5)}
              >
                Organization Logo
              </Typography>
              <Avatar
                user={organizationData}
                size="large"
                sx={{ width: 100, height: 100 }}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
              <Stack
                direction="row"
                spacing={2}
                alignItems={"center"}
                sx={{ paddingTop: theme.spacing(10) }}
              >
                <Typography
                  sx={{
                    color: "#667085",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    fontSize: 13,
                  }}
                  onClick={handleDeleteLogo}
                >
                  Delete
                </Typography>
                <Typography
                  sx={{
                    color: "#13715B",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    paddingLeft: theme.spacing(5),
                    fontSize: 13,
                  }}
                  onClick={handleUpdateLogo}
                >
                  Update
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      </Stack>
    </Stack>
  );
};

export default Organization;
