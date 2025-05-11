import {
  Button,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import Field from "../../Inputs/Field";
import { FileData } from "../../../../domain/types/File";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { Dayjs } from "dayjs";
import { useState } from "react";

export const inputStyles = {
  minWidth: 200,
  maxWidth: "100%",
  flexGrow: 1,
  height: 34,
};

interface SubClause {
  number: string;
  title: string;
  status: string;
  summary: string;
  keyQuestions: string[];
  evidenceExamples: string[];
}

interface Clause {
  number: number;
  title: string;
  subClauses: SubClause[];
}

interface VWISO42001ClauseDrawerDialogProps {
  open: boolean;
  onClose: () => void;
  subClause: SubClause | null;
  clause: Clause | null;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
}

const VWISO42001ClauseDrawerDialog = ({
  open,
  onClose,
  subClause,
  clause,
  evidenceFiles = [],
  uploadFiles = [],
}: VWISO42001ClauseDrawerDialogProps) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  console.log("subClause : ", subClause);
  return (
    <Drawer
      className="vw-iso-42001-clause-drawer-dialog"
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
        className="vw-iso-42001-clause-drawer-dialog-content"
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
            {clause?.number + "." + subClause?.number} {subClause?.title}
          </Typography>
          <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "#f8f9fa",
              borderLeft: `3px solid #13715B`,
              p: "10px",
              mt: "10px",
              mb: "15px",
            }}
          >
            <Typography fontSize={13} sx={{ marginBottom: "13px" }}>
              <strong>Requirement Summary: </strong>
              {subClause?.summary}
            </Typography>
            <Typography fontSize={13} fontWeight={600}>
              Key Questions:
            </Typography>
            <ul style={{ paddingLeft: "20px" }}>
              {subClause?.keyQuestions.map((question, index) => (
                <li key={index}>
                  <Typography fontSize={13}>{question}</Typography>
                </li>
              ))}
            </ul>

            <Typography fontSize={13} fontWeight={600}>
              Evidence Examples:
            </Typography>
            <ul style={{ paddingLeft: "20px" }}>
              {subClause?.evidenceExamples.map((example, index) => (
                <li key={index}>
                  <Typography fontSize={13}>{example}</Typography>
                </li>
              ))}
            </ul>
          </Paper>
        </Stack>
        <Divider />
        <Stack
          sx={{
            padding: "15px 20px",
          }}
          gap={"20px"}
        >
          <Stack>
            <Typography
              fontSize={13}
              fontWeight={600}
              sx={{ marginBottom: "5px" }}
            >
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
            value={subClause?.status || ""}
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
            <Typography
              fontSize={13}
              fontWeight={600}
              sx={{ marginBottom: "5px" }}
            >
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
      </Stack>
    </Drawer>
  );
};

export default VWISO42001ClauseDrawerDialog;
