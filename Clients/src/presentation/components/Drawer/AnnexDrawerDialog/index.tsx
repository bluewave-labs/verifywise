import { Divider, Drawer, Stack, Typography } from "@mui/material";
import { FileData } from "../../../../domain/types/File";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";

interface Control {}

interface Annex {}

interface VWISO42001ClauseDrawerDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  subClause: Control | null;
  clause: Annex | null;
  evidenceFiles?: FileData[];
  uploadFiles?: FileData[];
}

const VWISO42001AnnexDrawerDialog = ({
  title,
  open,
  onClose,
}: VWISO42001ClauseDrawerDialogProps) => {
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
          <Stack></Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO42001AnnexDrawerDialog;
