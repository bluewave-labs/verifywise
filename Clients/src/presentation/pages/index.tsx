import { Stack, Typography } from "@mui/material";
import DualButtonModal from "../vw-v2-components/Dialogs/DualButtonModal";

const Playground = () => {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <DualButtonModal
        title={"Really delete this file?"}
        body={
          <Typography className="dual-btn-modal-body">
            When you delete this file, all the links associated with the file
            will also be removed. Note that this is a non-reversible action.
          </Typography>
        }
        cancelText={"Cancel"}
        proceedText={"Delete file"}
        onCancel={() => console.log("Cancel")}
        onProceed={() => console.log("Delete file")}
        proceedButtonColor="error"
        proceedButtonVariant="contained"
      />
    </Stack>
  );
};

export default Playground;
