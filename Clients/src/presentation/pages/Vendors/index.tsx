import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Back } from "../../assets/icons/left-arrow-long.svg";
import Select from "../../components/Inputs/Select";
import "./index.css";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder";

const Vendors = () => {
  const theme = useTheme();

  return (
    <div className="vendors-page">
      <Stack gap={theme.spacing(10)}>
        <Stack
          justifyContent={"space-between"}
          display={"flex"}
          flexDirection={"row"}
          marginBottom={theme.spacing(10)}
        >
          <Button
            disableRipple
            focusRipple={false}
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color="inherit"
            sx={{
              width: 100,
              height: 30,
              gap: 6,
              fontSize: 13,
              boxShadow: "none",
              backgroundColor: "#F5F5F5",
              borderRadius: "4px",
              border: "1px solid #EBEBEB",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "#F5F5F5",
                boxShadow: "none",
              },
              textTransform: "capitalize",
            }}
            onClick={() => console.log("Back button")}
          >
            <Back />
            Back
          </Button>
          <Stack
            display={"flex"}
            gap={8}
            flexDirection={"row"}
            alignItems={"center"}
          >
            <Typography fontSize={13} color="#344054">
              Currently viewing project:
            </Typography>
            <Select
              id="projects"
              value={"1"}
              items={[
                { _id: "1", name: "ChatBot AI" },
                { _id: "2", name: "Chat-GPT 4" },
              ]}
              onChange={() => {}}
              sx={{ width: 150 }}
            />
          </Stack>
        </Stack>
        <Stack marginBottom={theme.spacing(10)}>
          <Typography fontSize={16} color="#1A1919" fontWeight={600}>
            Vendors list
          </Typography>
          <Typography fontSize={13} color="#344054">
            This table includes a list of external entity that provides
            AI-related products, services, or components. You can create and
            manage all vendors here.
          </Typography>
        </Stack>
        <Stack
          sx={{
            alignItems: "flex-end",
          }}
        >
          <Button
            variant="contained"
            sx={{
              width: 150,
              height: 34,
              fontSize: 13,
              textTransform: "capitalize",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              borderRadius: "4px",
              border: "1px solid #175CD3",
              "&:hover": {
                boxShadow: "none",
              },
            }}
            onClick={() => console.log("Add new vendor button")}
          >
            Add new vendor
          </Button>
        </Stack>
        <TableWithPlaceholder />
        <Stack
          sx={{
            alignItems: "flex-end",
          }}
        >
          <Button
            variant="contained"
            sx={{
              width: 150,
              height: 34,
              fontSize: 13,
              textTransform: "capitalize",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              borderRadius: "4px",
              border: "1px solid #175CD3",
              "&:hover": {
                boxShadow: "none",
              },
            }}
            onClick={() => console.log("Save button")}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </div>
  );
};

export default Vendors;
