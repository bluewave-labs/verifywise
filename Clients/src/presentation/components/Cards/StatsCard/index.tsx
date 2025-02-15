import { Stack, Typography } from "@mui/material";
import { StatsCardFrame, StatsCardRate } from "./style";
import ProgressBar from "../../ProjectCard/ProgressBar";

interface StatsCardProps {
  title: string;
  completed: number;
  total: number;
  progressbarColor: string;
}

const StatsCard = ({
  title,
  completed,
  total,
  progressbarColor,
}: StatsCardProps) => {
  const progress = `${completed}/${total}`;

  return (
    <Stack sx={StatsCardFrame}>
      <Stack
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
          mt: "10px",
        }}
      >
        <ProgressBar progress={progress} bgColor={progressbarColor} />
        <Typography
          sx={{
            color: "#8594AC",
            fontSize: 16,
          }}
        >
          {`${completed} ${title} out of ${total} is completed`}
        </Typography>
      </Stack>
      <Typography sx={StatsCardRate}>{`${
        (completed / total) * 100
      }%`}</Typography>
    </Stack>
  );
};

export default StatsCard;
