import { Link, Stack, useTheme } from "@mui/material";
import { HelpCircle as QuestionMarkIcon } from "lucide-react";
import { useGuiderStyles } from "./style";
import VWTooltip from "../../VWTooltip";

function Guider({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) {
  const theme = useTheme();
  const styles = useGuiderStyles();

  return (
    <VWTooltip
      header={title}
      content={
        <>
          <p>{description}</p>
          <Link
            href={link}
            sx={{
              color: theme.palette.common.white,
              fontSize: theme.typography.body2.fontSize,
            }}
          >
            Read more
          </Link>
        </>
      }
    >
      <Stack component={"div"} sx={styles.helperFrameStyle}>
        <QuestionMarkIcon size={16} />
      </Stack>
    </VWTooltip>
  );
}

export default Guider;
