import { Link, Stack } from "@mui/material";
import { HelpCircle as QuestionMarkIcon } from "lucide-react";
import { GuiderStyler } from "./style";
import VWTooltip from "../../VWTooltip";

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
    <VWTooltip
      header={title}
      content={
        <>
          <p>{description}</p>
          <Link href={link} sx={{ color: "white", fontSize: "13px" }}>
            Read more
          </Link>
        </>
      }
    >
      <Stack component={"div"} sx={theme.helperFrameStyle}>
        <QuestionMarkIcon size={16} />
      </Stack>
    </VWTooltip>
  );
};

export default Guider;
