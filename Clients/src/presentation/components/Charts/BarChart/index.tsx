import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import "./index.css";
import { useEffect, useState } from "react";

const formatDate = (date: any, customOptions: any) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    ...customOptions,
  };

  // Return the date using the specified options
  return date
    .toLocaleString("en-US", options)
    .replace(/\b(AM|PM)\b/g, (match: any) => match.toLowerCase());
};

const BarChart = ({ checks }: { checks: any[] }) => {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  });

  if (checks.length === 1) {
    checks[0] = { ...checks[0], responseTime: 50 };
  }

  if (checks.length !== 25) {
    const placeholders = Array(25 - checks.length).fill("placeholder");
    checks = [...checks, ...placeholders];
  }

  return (
    <Stack
      onClick={(event) => event.stopPropagation()}
      sx={{
        cursor: "default",
        direction: "row",
        flexWrap: "nowrap",
        gap: theme.spacing(1.5),
        height: 50,
        width: "fit-content",
      }}
    >
      {checks.map((check: any, index: number) =>
        check === "placeholder" ? (
          <Box
            key={`${check}-${index}`}
            sx={{
              borderRadius: theme.spacing(1.5),
              position: "relative",
              backgroundColor: theme.palette.background.fill,
              height: "100%",
            }}
          />
        ) : (
          <Tooltip
            title={
              <>
                <Typography>
                  {formatDate(new Date(check.createdAt), { year: undefined })}
                </Typography>
                <Box mt={theme.spacing(2)}>
                  <Box
                    sx={{
                      borderRadius: "50%",
                      display: "inline-block",
                      width: theme.spacing(4),
                      height: theme.spacing(4),
                      backgroundColor: check.status
                        ? theme.palette.success.main
                        : theme.palette.error.text,
                    }}
                  />
                  <Stack
                    display="inline-flex"
                    direction="row"
                    justifyContent="space-between"
                    ml={theme.spacing(2)}
                    gap={theme.spacing(12)}
                  >
                    <Typography component="span" sx={{ opacity: 0.8 }}>
                      Response Time
                    </Typography>
                    <Typography component="span">
                      {check.originalResponseTime}
                      <Typography component="span" sx={{ opacity: 0.8 }}>
                        {" "}
                        ms
                      </Typography>
                    </Typography>
                  </Stack>
                </Box>
              </>
            }
            placement="top"
            key={`check-${check?._id}`}
            slotProps={{
              popper: {
                className: "bar-tooltip",
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
                sx: {
                  "& .MuiTooltip-tooltip": {
                    backgroundColor: theme.palette.background.main,
                    border: 1,
                    borderColor: theme.palette.border,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.boxShadow,
                    px: theme.spacing(4),
                    py: theme.spacing(2),
                  },
                  "& .MuiTooltip-tooltip p": {
                    fontSize: 12,
                    color: theme.palette.text.tertiary,
                    fontWeight: 500,
                  },
                  "& .MuiTooltip-tooltip span": {
                    fontSize: 11,
                    color: theme.palette.text.tertiary,
                    fontWeight: 600,
                  },
                },
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "9px",
                height: "100%",
                borderRadius: theme.spacing(1.5),
                "&:hover > .MuiBox-root": {
                  filter: "brightness(0.8)",
                },
                backgroundColor: check.status
                  ? theme.palette.success.bg
                  : theme.palette.error.bg,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  borderRadius: theme.spacing(1.5),
                  transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                  bottom: 0,
                  width: "100%",
                  height: `${animate ? check.responseTime : 0}%`,
                  backgroundColor: check.status
                    ? theme.palette.success.main
                    : theme.palette.error.text,
                }}
              />
            </Box>
          </Tooltip>
        )
      )}
    </Stack>
  );
};

export default BarChart;
