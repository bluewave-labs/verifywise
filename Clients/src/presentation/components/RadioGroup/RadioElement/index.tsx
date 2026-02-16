import styled from "styled-components";
import { Radio, RadioProps, useTheme } from "@mui/material";
import { styles } from "./styles";

const BpIcon = styled("span")(() => ({ ...styles.BpIcon }));
const BpCheckedIcon = styled(BpIcon)({ ...styles.BpCheckedIcon });

const RadioElement = (props: RadioProps) => {
  const theme = useTheme();
  return (
    <Radio
      disableRipple
      sx={{
        color: theme.palette.border.dark,
      }}
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  );
};

export default RadioElement;
