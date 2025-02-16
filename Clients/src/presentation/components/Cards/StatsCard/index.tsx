import { Stack, Typography } from "@mui/material";
import { StatsCardFrame, StatsCardRate } from "./style";
import ProgressBar from "../../ProjectCard/ProgressBar";
import { useMemo } from "react";

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
  const progress = useMemo(() => `${completed}/${total}`, [completed, total]);
  const percentage = useMemo(() => {
    if (total === 0 || isNaN(completed) || isNaN(total)) return 0;
    const result = Math.floor((Number(completed) / Number(total)) * 100);
    return isNaN(result) ? 0 : result;
  }, [completed, total]);

  if (
    typeof completed !== "number" ||
    typeof total !== "number" ||
    total < 0 ||
    completed < 0
  ) {
    console.error(
      "Invalid props: completed and total should be non-negative numbers."
    );
    return null;
  }

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
            fontSize: 13,
          }}
        >
          {`${completed} ${title} out of ${total} is completed`}
        </Typography>
      </Stack>
      <Typography sx={StatsCardRate}>{`${percentage}%`}</Typography>
    </Stack>
  );
};

export default StatsCard;
