import { Link, Stack, Tooltip, Typography } from "@mui/material";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { GuiderStyler } from "./style";

const Guider = ({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) => {
  const theme = GuiderStyler();

  return (
    <Tooltip
      sx={{ fontSize: 13 }}
      title={
        <Stack
          className="tooltip-note"
          sx={{
            display: "flex",
            gap: 3,
          }}
        >
          <Typography fontSize={14} fontWeight={"bold"}>
            {title}
          </Typography>
          <Typography fontSize={13}>{description}</Typography>
          <Link href={`${link}`} sx={{ color: "white" }} fontSize={13}>
            Read more
          </Link>
        </Stack>
      }
    >
      <Stack component={"div"} sx={theme.helperFrameStyle}>
        <QuestionMarkIcon />
      </Stack>
    </Tooltip>
  );
};

export default Guider;
