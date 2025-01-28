import { Stack, Typography } from "@mui/material";
import DualButtonModal from "../vw-v2-components/Dialogs/DualButtonModal";

const Playground = () => {
  return (
    <Stack
      sx={{
        margin: "auto",
        padding: 20,
        width: "80%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <DualButtonModal
        title="Do you want to create demo data?"
        TitleFontSize={16}
        body={
          <>
            <Typography fontSize={13} textAlign={"justify"}>
              If you accept, we’ll generate demo (mock) data for you, allowing
              you to explore and get a hands-on understanding of how VerifyWise
              works. We highly recommend this option.
            </Typography>
            <Typography fontSize={13} textAlign={"justify"}>
              This option will create 2 projects and 2 users. You’ll be able to
              remove them later.
            </Typography>
          </>
        }
        onCancel={() => {}}
        cancelText="Cancel"
        onProceed={() => {}}
        proceedText="Create demo data"
        proceedButtonVariant="contained"
      />
    </Stack>
  );
};

export default Playground;
