import { Divider, Drawer, Stack, Typography } from "@mui/material";
import { FileData } from "../../../../domain/types/File";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";

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
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default VWISO42001AnnexDrawerDialog;
