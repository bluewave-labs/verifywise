import { Button, Divider, Drawer, Stack, Typography } from "@mui/material";
import { FileData } from "../../../../domain/types/File";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Checkbox from "../../Inputs/Checkbox";
import Field from "../../Inputs/Field";
import { inputStyles } from "../ClauseDrawerDialog";
import DatePicker from "../../Inputs/Datepicker";
import Select from "../../Inputs/Select";
import { useState } from "react";
import { Dayjs } from "dayjs";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";

interface Control {
  id: number;
  control_no: number;
  control_subSection: number;
  title: string;
  shortDescription: string;
  guidance: string;
  status: string;
}

interface Annex {
  id: number;
  order: number;
  title: string;
  controls: Control[];
}

interface VWISO42001ClauseDrawerDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  control: Control | null;
  annex: Annex | null;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
}

const VWISO42001AnnexDrawerDialog = ({
  title,
  open,
  onClose,
  control,
  annex,
  evidenceFiles = [],
  uploadFiles = [],
}: VWISO42001ClauseDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);

  return (
    <Drawer
      className="vw-iso-42001-annex-drawer-dialog"
      open={open}
      onClose={onClose}
      sx={{
        width: 600,
        margin: 0,
        "& .MuiDrawer-paper": {
          margin: 0,
          borderRadius: 0,
        },
      }}
      anchor="right"
    >
      <Stack
        className="vw-iso-42001-annex-drawer-dialog-content"
        sx={{
          width: 600,
        }}
      >
        <Stack
          sx={{
            width: 600,
            padding: "15px 20px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontSize={15} fontWeight={700}>
            {title}
          </Typography>
          <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            gap: "15px",
          }}
        >
          <Stack
            className="vw-iso-42001-annex-drawer-dialog-content-annex-guidance"
            sx={{
              border: `1px solid #eee`,
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
            }}
          >
            <Typography fontSize={13}>
              <strong>Guidance:</strong> {control?.guidance}
            </Typography>
          </Stack>
          <Stack
            className="vw-iso-42001-annex-drawer-dialog-applicability"
            sx={{
              gap: "15px",
            }}
          >
            <Typography fontSize={13}>Applicability:</Typography>
            <Stack sx={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <Checkbox
                id={`${control?.id}-${annex?.id}-iso-42001`}
                label="Applicable"
                isChecked={false}
                value={"Applicable"}
                onChange={() => {}}
                size="small"
              />
              <Checkbox
                id={`${control?.id}-${annex?.id}-iso-42001`}
                label="Not Applicable"
                isChecked={false}
                value={"Not Applicable"}
                onChange={() => {}}
                size="small"
              />
            </Stack>
          </Stack>
          <Stack>
            <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
              {"Justification for Exclusion (if Not Applicable)"}:
            </Typography>
            <Field
              type="description"
              sx={{
                cursor: "text",
                "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                  {
                    height: "73px",
                  },
              }}
              placeholder="Required if control is not applicable..."
            />
          </Stack>
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
            gap: "15px",
          }}
        >
          <Stack>
            <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
              Implementation Description:
            </Typography>
            <Field
              type="description"
              sx={{
                cursor: "text",
                "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                  {
                    height: "73px",
                  },
              }}
              placeholder="Describe how this requirement is implemented"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                borderRadius: 2,
                width: 155,
                height: 25,
                fontSize: 11,
                border: "1px solid #D0D5DD",
                backgroundColor: "white",
                color: "#344054",
              }}
              disableRipple={false}
              onClick={() => {}}
            >
              Add/Remove evidence
            </Button>
            <Stack direction="row" spacing={10}>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#344054",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  margin: "auto",
                  textWrap: "wrap",
                }}
              >
                {`${evidenceFiles.length || 0} evidence files attached`}
              </Typography>
              {uploadFiles.length > 0 && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#344054",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    margin: "auto",
                    textWrap: "wrap",
                  }}
                >
                  {`${uploadFiles.length} ${
                    uploadFiles.length === 1 ? "file" : "files"
                  } pending upload`}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
          gap={"20px"}
        >
          <Select
            id="status"
            label="Status:"
            value={control?.status || ""}
            onChange={() => {}}
            items={[
              { _id: "Not Started", name: "Not Started" },
              { _id: "Draft", name: "Draft" },
              { _id: "In Progress", name: "In Progress" },
              { _id: "Awaiting Review", name: "Awaiting Review" },
              { _id: "Awaiting Approval", name: "Awaiting Approval" },
              { _id: "Implemented", name: "Implemented" },
              { _id: "Audited", name: "Audited" },
              { _id: "Needs Rework", name: "Needs Rework" },
            ]}
            sx={inputStyles}
            placeholder={"Select status"}
          />

          <Select
            id="Owner"
            label="Owner:"
            value={""}
            onChange={() => {}}
            items={[]}
            sx={inputStyles}
            placeholder={"Select owner"}
          />

          <Select
            id="Reviewer"
            label="Reviewer:"
            value={""}
            onChange={() => {}}
            items={[]}
            sx={inputStyles}
            placeholder={"Select reviewer"}
          />

          <Select
            id="Approver"
            label="Approver:"
            value={""}
            onChange={() => {}}
            items={[]}
            sx={inputStyles}
            placeholder={"Select approver"}
          />

          <DatePicker
            label="Due date:"
            sx={inputStyles}
            date={date}
            handleDateChange={(newDate) => {
              setDate(newDate);
            }}
          />
          <Stack>
            <Typography fontSize={13} sx={{ marginBottom: "5px" }}>
              Auditor Feedback:
            </Typography>
            <Field
              type="description"
              sx={{
                cursor: "text",
                "& .field field-decription field-input MuiInputBase-root MuiInputBase-input":
                  {
                    height: "73px",
                  },
              }}
              placeholder="Enter any feedback from the internal or external audits..."
            />
          </Stack>
        </Stack>

        <Divider />
        <Stack
          className="vw-iso-42001-annex-drawer-dialog-footer"
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            padding: "15px 20px",
          }}
        >
          <VWButton
            variant="contained"
            text="Save"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            onClick={() => {}}
            icon={<SaveIcon />}
          />
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO42001AnnexDrawerDialog;
