import { Divider, Drawer, Stack, Typography } from "@mui/material";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";

interface SubClause {
  number: string;
  title: string;
  status: string;
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
  return (
    <Drawer
      className="vw-iso-42001-clause-drawer-dialog"
      open={open}
      onClose={onClose}
      sx={{
        margin: 0,
        "& .MuiDrawer-paper": {
          margin: 0,
          borderRadius: 0,
        },
      }}
      anchor="right"
    >
      <Stack className="vw-iso-42001-clause-drawer-dialog-content">
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
      </Stack>
    </Drawer>
  );
};

export default VWISO42001ClauseDrawerDialog;
