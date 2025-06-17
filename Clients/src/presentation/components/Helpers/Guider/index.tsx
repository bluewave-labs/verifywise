import { Stack } from "@mui/material";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { GuiderStyler } from "./style";

const Guider = () => {
  const theme = GuiderStyler();

  return (
    <Stack component={"div"} sx={theme.helperFrameStyle}>
      <QuestionMarkIcon />
    </Stack>
  );
};

export default Guider;
