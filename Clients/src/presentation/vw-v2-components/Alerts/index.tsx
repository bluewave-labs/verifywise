import { Alert, Typography } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";

const alertStyles = singleTheme.alertStyles;

type VWAlertProps = {
  title?: string;
  status?: "success" | "info" | "warning" | "error";
};

const VWAlert = ({
  title = "This is a success vwAlert — check it out!",
  status = "success",
}: VWAlertProps) => {
  const { text, bg, border } = alertStyles[status];

  return (
    <Alert
      severity={status}
      onClose={() => {}}
      sx={{ border: `1px solid ${border}`, backgroundColor: bg }}
    >
      <Typography color={text} fontSize={13}>
        {title}
      </Typography>
    </Alert>
  );
};

export default VWAlert;
