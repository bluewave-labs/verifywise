import { Skeleton, Stack, SxProps, Theme } from "@mui/material";

// variants are text | rectangular | circular | rounded

const CustomizableSkeleton = ({
  variant = "text",
  width,
  maxWidth,
  minWidth,
  height,
  maxHeight,
  minHeight,
  sx,
}: {
  variant?: "text" | "rectangular" | "circular" | "rounded";
  width?: number | string;
  maxWidth?: number | string;
  minWidth?: number | string;
  height?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;
  sx?: SxProps<Theme> | undefined;
}) => {
  return (
    <Stack sx={{ padding: 4, paddingX: 0 }}>
      <Skeleton
        variant={variant}
        sx={{ width, height, maxWidth, minWidth, maxHeight, minHeight, ...sx }}
      ></Skeleton>
    </Stack>
  );
};

export default CustomizableSkeleton;
