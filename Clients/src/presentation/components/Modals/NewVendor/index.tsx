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
  return (
    <Modal open={isOpen} onClose={setIsOpen} sx={{ overflowY: "scroll" }}>
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
          <Close style={{ cursor: "pointer" }} />
        </Stack>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange}>
              <Tab
                sx={{
                  width: 90,
                  paddingX: 0,
                  textTransform: "capitalize",
                  fontSize: 13,
                }}
                label="Vendor details"
                value="1"
              />
              <Tab
                sx={{
                  width: 90,
                  paddingX: 0,
                  textTransform: "capitalize",
                  fontSize: 13,
                }}
                label="Risks"
                value="2"
              />
            </TabList>
          </Box>
          <TabPanel
            value="1"
            sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}
          >
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
              <Box justifyContent={"space-between"} display={"grid"}>
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
          <Stack
            sx={{
              alignItems: "flex-end",
            }}
          >
            <Button
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
          <TabPanel value="2">Item Two</TabPanel>
        </TabContext>
      </Stack>
    </Modal>
  );
};

export default AddNewVendor;
