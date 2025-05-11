import { Divider, Drawer, Paper, Stack, Typography } from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";

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
}

const VWISO42001ClauseDrawerDialog = ({
  open,
  onClose,
  subClause,
  clause,
}: VWISO42001ClauseDrawerDialogProps) => {
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
          <CloseIcon />
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
      </Stack>
    </Drawer>
  );
};

export default VWISO42001ClauseDrawerDialog;
