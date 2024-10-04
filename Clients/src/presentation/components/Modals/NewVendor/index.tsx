/**
 * Component for adding a new vendor through a modal interface.
 *
 * @component
 * @param {AddNewVendorProps} props - The properties for the AddNewVendor component.
 * @param {boolean} props.isOpen - Determines if the modal is open.
 * @param {() => void} props.setIsOpen - Function to set the modal open state.
 * @param {string} props.value - The current value of the selected tab.
 * @param {(event: React.SyntheticEvent, newValue: string) => void} props.handleChange - Function to handle tab change events.
 *
 * @returns {JSX.Element} The rendered AddNewVendor component.
 */

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {
  Box,
  Button,
  Modal,
  Stack,
  Tab,
  Typography,
  useTheme,
} from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";

interface AddNewVendorProps {
  isOpen: boolean;
  setIsOpen: () => void;
  value: string;
  handleChange: (event: React.SyntheticEvent, newValue: string) => void;
}

const AddNewVendor: React.FC<AddNewVendorProps> = ({
  isOpen,
  setIsOpen,
  value,
  handleChange,
}) => {
  const theme = useTheme();

  const vendorDetailsPanel = (
    <TabPanel value="1" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
      >
        <Field label="Vendor name" width={350} />
        <Field label="Project the vendor is connected to" width={350} />
      </Stack>
      <Stack marginBottom={theme.spacing(10)}>
        <Field
          label="What does the vendor provide?"
          width={"100%"}
          type="description"
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
      >
        <Field label="Website" width={350} />
        <Field label="Vendor contact person" width={350} />
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
        flexDirection={"row"}
      >
        <Field label="Review result" width={350} type="description" />
        <Box
          justifyContent={"space-between"}
          display={"grid"}
          gap={theme.spacing(10)}
        >
          <Select
            items={[
              { _id: 1, name: "Select review status" },
              { _id: 2, name: "Select review status" },
            ]}
            label="Review status"
            placeholder="Select review status"
            isHidden={false}
            id=""
            onChange={() => {}}
            value={"Select review status"}
            sx={{
              width: 350,
            }}
          />
          <Select
            items={[
              { _id: 1, name: "Select reviewer" },
              { _id: 2, name: "Select reviewer" },
            ]}
            label="Reviewer"
            placeholder="Select reviewer"
            isHidden={false}
            id=""
            onChange={() => {}}
            value={"Select reviewer"}
            sx={{
              width: 350,
            }}
          />
        </Box>
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
        flexDirection={"row"}
      >
        <Select
          items={[
            { _id: 1, name: "Select risk status" },
            { _id: 2, name: "Select risk status" },
          ]}
          label="Risk status"
          placeholder="Select risk status"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select risk status"}
          sx={{
            width: 350,
          }}
        />
        <DatePicker
          label="Review date"
          sx={{
            width: 350,
          }}
        />
      </Stack>
    </TabPanel>
  );

  const risksPanel = (
    <TabPanel value="2" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
      >
        <Field label="Risk description" width={350} />
        <Field label="Impact description" width={350} />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
      >
        <Select
          items={[
            { _id: 1, name: "Select project" },
            { _id: 2, name: "Select project" },
          ]}
          label="Project name"
          placeholder="Select project"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select project"}
          sx={{
            width: 350,
          }}
        />
        <Select
          items={[
            { _id: 1, name: "Select probability" },
            { _id: 2, name: "Select probability" },
          ]}
          label="Probability"
          placeholder="Select probability"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select probability"}
          sx={{
            width: 350,
          }}
        />
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
        flexDirection={"row"}
      >
        <Box justifyContent={"space-between"} display={"grid"}>
          <Select
            items={[
              { _id: 1, name: "Select impact" },
              { _id: 2, name: "Select impact" },
            ]}
            label="Impact"
            placeholder="Select impact"
            isHidden={false}
            id=""
            onChange={() => {}}
            value={"Select impact"}
            sx={{
              width: 350,
            }}
          />
          <Select
            items={[
              { _id: 1, name: "Select owner" },
              { _id: 2, name: "Select owner" },
            ]}
            label="Action owner"
            placeholder="Select owner"
            isHidden={false}
            id=""
            onChange={() => {}}
            value={"Select owner"}
            sx={{
              width: 350,
            }}
          />
        </Box>
        <Field label="Review result" width={350} type="description" />
      </Stack>

      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(10)}
      >
        <Select
          items={[
            { _id: 1, name: "Select risk severity" },
            { _id: 2, name: "Select risk severity" },
          ]}
          label="Risk severity"
          placeholder="Select risk severity"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select risk severity"}
          sx={{
            width: 350,
          }}
        />
        <Select
          items={[
            { _id: 1, name: "Select risk severity" },
            { _id: 2, name: "Select risk severity" },
          ]}
          label="Likelihood"
          placeholder="Select risk severity"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select risk severity"}
          sx={{
            width: 350,
          }}
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"flex-start"}
        marginBottom={theme.spacing(10)}
      >
        <Select
          items={[
            { _id: 1, name: "Select risk level" },
            { _id: 2, name: "Select risk level" },
          ]}
          label="Risk level"
          placeholder="Select risk level"
          isHidden={false}
          id=""
          onChange={() => {}}
          value={"Select risk level"}
          sx={{
            width: 350,
          }}
        />
      </Stack>
    </TabPanel>
  );
  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen()}
      sx={{ overflowY: "scroll" }}
    >
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        sx={{
          backgroundColor: "#D9D9D9",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          bgcolor: theme.palette.background.main,
          border: 1,
          borderColor: theme.palette.border,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(15),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Stack
          display={"flex"}
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Typography
            fontSize={16}
            fontWeight={600}
            marginBottom={theme.spacing(5)}
          >
            Add new vendor
          </Typography>
          <Close style={{ cursor: "pointer" }} onClick={setIsOpen} />
        </Stack>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange}>
              <Tab
                sx={{
                  width: 120,
                  paddingX: 0,
                  textTransform: "inherit",
                  fontSize: 13,
                  "& .MuiTouchRipple-root": {
                    display: "none",
                  },
                }}
                label="Vendor details"
                value="1"
              />
              <Tab
                sx={{
                  width: 60,
                  paddingX: 0,
                  textTransform: "capitalize",
                  fontSize: 13,
                  "& .MuiTouchRipple-root": {
                    display: "none",
                  },
                }}
                label="Risks"
                value="2"
              />
            </TabList>
          </Box>
          {vendorDetailsPanel}
          {risksPanel}
          <Stack
            sx={{
              alignItems: "flex-end",
            }}
          >
            <Button
              disableRipple
              variant="contained"
              sx={{
                width: 70,
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
        </TabContext>
      </Stack>
    </Modal>
  );
};

export default AddNewVendor;
