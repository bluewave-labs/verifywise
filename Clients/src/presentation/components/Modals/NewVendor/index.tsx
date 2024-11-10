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
import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

interface VendorDetails {
  vendorName: string;
  projectVendorIsConnectedTo: string;
  vendorProvides: string;
  website: string;
  vendorContactPerson: string;
  reviewResult: string;
  reviewStatus: string;
  reviewer: string;
  riskStatus: string;
  reviewDate: string;
}

interface Risks {
  riskDescription: string;
  impactDescription: string;
  projectName: string;
  probability: string;
  impact: string;
  actionOwner: string;
  riskSeverity: string;
  likelihood: string;
  riskLevel: string;
}

interface Values {
  vendorDetails: VendorDetails;
  risks: Risks;
}

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
  const [values, setValues] = useState({
    vendorDetails: {
      vendorName: "",
      projectVendorIsConnectedTo: "",
      vendorProvides: "",
      website: "",
      vendorContactPerson: "",
      reviewResult: "",
      reviewStatus: "0",
      reviewer: "0",
      riskStatus: "0",
      reviewDate: "",
      assignee: "0",
    },
    risks: {
      riskDescription: "",
      impactDescription: "",
      projectName: "0",
      probability: "0",
      impact: "0",
      actionOwner: "0",
      riskSeverity: "0",
      likelihood: "0",
      riskLevel: "0",
    },
  });

  const handleDateChange = (newDate: Dayjs | null) => {
    setValues((prevValues) => ({
      ...prevValues,
      vendorDetails: {
        ...prevValues.vendorDetails,
        reviewDate: newDate ? newDate.toISOString() : "",
      },
    }));
  };

  const handleOnChange = (
    section: keyof Values,
    field: string,
    value: string | number
  ) => {
    setValues((prevValues) => ({
      ...prevValues,
      [section]: {
        ...prevValues[section],
        [field]: value,
      },
    }));
  };

  const handleOnSave = () => {
    console.log("Vendor Details:", values.vendorDetails);
    console.log("Risks:", values.risks);
  };

  const vendorDetailsPanel = (
    <TabPanel value="1" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Field
          label="Vendor name"
          width={220}
          value={values.vendorDetails.vendorName}
          onChange={(e) =>
            handleOnChange("vendorDetails", "vendorName", e.target.value)
          }
        />
        <Field
          label="Website"
          width={220}
          value={values.vendorDetails.website}
          onChange={(e) =>
            handleOnChange("vendorDetails", "website", e.target.value)
          }
        />
        <Select
          items={[
            { _id: 1, name: "Chatbot AI" },
            { _id: 2, name: "Marketing AI" },
            { _id: 3, name: "Compliance AI" },
          ]}
          label="Project name"
          placeholder="Select project"
          isHidden={false}
          id=""
          value={values.risks.projectName}
          onChange={(e) =>
            handleOnChange("risks", "projectName", e.target.value)
          }
          sx={{
            width: 220,
          }}
        />
      </Stack>
      <Stack marginBottom={theme.spacing(8)}>
        <Field
          label="What does the vendor provide?"
          width={"100%"}
          type="description"
          value={values.vendorDetails.vendorProvides}
          onChange={(e) =>
            handleOnChange("vendorDetails", "vendorProvides", e.target.value)
          }
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Field
          label="Vendor contact person"
          width={220}
          value={values.vendorDetails.vendorContactPerson}
          onChange={(e) =>
            handleOnChange(
              "vendorDetails",
              "vendorContactPerson",
              e.target.value
            )
          }
        />
        <Select
          items={[
            { _id: 1, name: "Under Review" },
            { _id: 2, name: "Completed" },
            { _id: 3, name: "Failed" },
          ]}
          label="Review status"
          placeholder="Select review status"
          isHidden={false}
          id=""
          onChange={(e) =>
            handleOnChange("vendorDetails", "reviewStatus", e.target.value)
          }
          value={values.vendorDetails.reviewStatus}
          sx={{
            width: 220,
          }}
        />
        <Select
          items={[
            { _id: 1, name: "George Michael" },
            { _id: 2, name: "Sarah Lee" },
            { _id: 3, name: "Michael Lee" },
          ]}
          label="Reviewer"
          placeholder="Select reviewer"
          isHidden={false}
          id=""
          onChange={(e) =>
            handleOnChange("vendorDetails", "reviewer", e.target.value)
          }
          value={values.vendorDetails.reviewer}
          sx={{
            width: 220,
          }}
        />
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
        flexDirection={"row"}
      >
        <Field
          label="Review result"
          width={"100%"}
          type="description"
          value={values.vendorDetails.reviewResult}
          onChange={(e) =>
            handleOnChange("vendorDetails", "reviewResult", e.target.value)
          }
        />
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
        flexDirection={"row"}
      >
        <Select
          items={[
            { _id: 1, name: "High" },
            { _id: 2, name: "Moderate" },
            { _id: 3, name: "Low" },
          ]}
          label="Risk status"
          placeholder="Select risk status"
          isHidden={false}
          id=""
          onChange={(e) =>
            handleOnChange("vendorDetails", "riskStatus", e.target.value)
          }
          value={values.vendorDetails.riskStatus}
          sx={{
            width: 220,
          }}
        />
        <Select
          items={[
            { _id: 1, name: "Assignee 1" },
            { _id: 2, name: "Assignee 2" },
            { _id: 3, name: "Assignee 3" },
          ]}
          label="Assignee"
          placeholder="Select person"
          isHidden={false}
          id=""
          onChange={(e) =>
            handleOnChange("vendorDetails", "assignee", e.target.value)
          }
          value={values.vendorDetails.riskStatus}
          sx={{
            width: 220,
          }}
        />
        <DatePicker
          label="Review date"
          sx={{
            width: 220,
          }}
          date={
            values.vendorDetails.reviewDate
              ? dayjs(values.vendorDetails.reviewDate)
              : null
          }
          handleDateChange={handleDateChange}
        />
      </Stack>
    </TabPanel>
  );

  const risksPanel = (
    <TabPanel value="2" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Field
          label="Risk description"
          width={350}
          value={values.risks.riskDescription}
          onChange={(e) =>
            handleOnChange("risks", "riskDescription", e.target.value)
          }
        />
        <Field
          label="Impact description"
          width={350}
          value={values.risks.impactDescription}
          onChange={(e) =>
            handleOnChange("risks", "impactDescription", e.target.value)
          }
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Select
          items={[
            { _id: 1, name: "High" },
            { _id: 2, name: "Moderate" },
            { _id: 3, name: "Low" },
          ]}
          label="Impact"
          placeholder="Select impact"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("risks", "impact", e.target.value)}
          value={values.risks.impact}
          sx={{
            width: 350,
          }}
        />

        <Select
          items={[
            { _id: 1, name: "4" },
            { _id: 2, name: "3" },
            { _id: 3, name: "2" },
          ]}
          label="Probability"
          placeholder="Select probability"
          isHidden={false}
          id=""
          value={values.risks.probability}
          onChange={(e) =>
            handleOnChange("risks", "probability", e.target.value)
          }
          sx={{
            width: 350,
          }}
        />
      </Stack>
      <Stack
        display={"flex"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
        flexDirection={"row"}
      >
        <Box
          justifyContent={"space-between"}
          display={"grid"}
          gap={theme.spacing(8)}
        >
          <Select
            items={[
              { _id: 1, name: "Critical" },
              { _id: 2, name: "Major" },
              { _id: 3, name: "Minor" },
            ]}
            label="Risk severity"
            placeholder="Select risk severity"
            isHidden={false}
            id=""
            onChange={(e) =>
              handleOnChange("risks", "riskSeverity", e.target.value)
            }
            value={values.risks.riskSeverity}
            sx={{
              width: 350,
            }}
          />

          <Select
            items={[
              { _id: 1, name: "John McAllen" },
              { _id: 2, name: "Jessica Parker" },
              { _id: 3, name: "Michael Johnson" },
            ]}
            label="Action owner"
            placeholder="Select owner"
            isHidden={false}
            id=""
            onChange={(e) =>
              handleOnChange("risks", "actionOwner", e.target.value)
            }
            value={values.risks.actionOwner}
            sx={{
              width: 350,
            }}
          />
        </Box>
        <Field
          label="Review result"
          width={350}
          type="description"
          value={values.vendorDetails.reviewResult}
          onChange={(e) =>
            handleOnChange("vendorDetails", "reviewResult", e.target.value)
          }
        />
      </Stack>

      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Select
          items={[
            { _id: 1, name: "High" },
            { _id: 2, name: "Moderate" },
            { _id: 3, name: "Low" },
          ]}
          label="Risk level"
          placeholder="Select risk level"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("risks", "riskLevel", e.target.value)}
          value={values.risks.riskLevel}
          sx={{
            width: 350,
          }}
        />
        <Select
          items={[
            { _id: 1, name: "Probable" },
            { _id: 2, name: "Possible" },
            { _id: 3, name: "Unlikely" },
          ]}
          label="Likelihood"
          placeholder="Select risk severity"
          isHidden={false}
          id=""
          onChange={(e) =>
            handleOnChange("risks", "likelihood", e.target.value)
          }
          value={values.risks.likelihood}
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
              onClick={handleOnSave}
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
