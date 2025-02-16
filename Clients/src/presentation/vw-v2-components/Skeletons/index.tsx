import { Skeleton, Stack } from "@mui/material";

// variants are text | rectangular | circular | rounded

const VWSkeleton = ({
  variant = "text",
  width,
  maxWidth,
  minWidth,
  height,
  maxHeight,
  minHeight,
}: {
  variant?: "text" | "rectangular" | "circular" | "rounded";
  width?: number | string;
  maxWidth?: number | string;
  minWidth?: number | string;
  height?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;
}) => {
  return (
    <Stack sx={{ padding: 4, paddingX: 0 }}>
      <Skeleton
        variant={variant}
        sx={{ width, height, maxWidth, minWidth, maxHeight, minHeight }}
      ></Skeleton>
    </Stack>
  );
};

export default VWSkeleton;
