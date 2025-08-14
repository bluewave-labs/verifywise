import { Box, Stack, Typography } from "@mui/material";
import { ReactComponent as CalendarIcon } from "../../../assets/icons/calendar-check.svg";
import { ReactComponent as ClockIcon } from "../../../assets/icons/clock.svg";
import { ReactComponent as AlertIcon } from "../../../assets/icons/alert-circle.svg";

const TaskRadar = ({ overdue, due, upcoming }: { overdue: number; due: number; upcoming: number }) => {
  return (
    <Stack sx={{
      border: `1px solid #eaecf0`,
      borderRadius: 2,
      backgroundColor: "#FFFFFF",
      minWidth: 228,
      width: "100%",
      padding: "8px 14px 14px 14px",
    }}>
      <Typography sx={{
        fontSize: 13,
        color: "#8594AC",
        pb: "2px",
        textWrap: "wrap",
      }}>
        Task radar
      </Typography>

      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >

        <Stack sx={{
          backgroundColor: "#FEE2E2",
          borderRadius: 2,
          padding: "6px 12px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
            <AlertIcon />
            <Typography
              sx={{
                fontSize: 13,
                color: "#344054",
                textAlign: "justify",
              }}
            >
              Overdue
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: 13,
            textAlign: "justify",
            color: "#A65E5E",
            fontWeight: "bold",
          }}>
            {overdue}
          </Typography>
        </Stack>

        <Stack sx={{
          backgroundColor: "#FEF3C7",
          borderRadius: 2,
          padding: "6px 12px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
            <ClockIcon />
            <Typography
              sx={{
                fontSize: 13,
                color: "#344054",
                textAlign: "justify",
              }}
            >
              Due ≤ 7 days
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: 13,
            textAlign: "justify",
            color: "#917D30",
            fontWeight: "bold",
          }}>
            {due}
          </Typography>
        </Stack>

        <Stack sx={{
          backgroundColor: "#DCFCE7",
          borderRadius: 2,
          padding: "6px 12px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
            <CalendarIcon />
            <Typography
              sx={{
                fontSize: 13,
                color: "#344054",
                textAlign: "justify",
              }}
            >
              Upcoming
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: 13,
            textAlign: "justify",
            color: "#56946C",
            fontWeight: "bold",
          }}>
            {upcoming}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TaskRadar;
