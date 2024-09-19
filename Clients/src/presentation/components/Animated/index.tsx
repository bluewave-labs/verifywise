/**
 * Represents a PulseDot component.
 * @param {Object} props
 * @param {string} props.color - The color of the PulseDot.
 * @returns {JSX.Element} The rendered PulseDot component.
 */

import { Box, Stack } from "@mui/material";

const PulseDot = ({ color }: { color: string }) => {
  return (
    <Stack
      sx={{
        width: 26,
        height: 26,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          minWidth: 18,
          minHeight: 18,
          position: "relative",
          backgroundColor: color,
          borderRadius: "50%",
          "&::before": {
            content: `""`,
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "inherit",
            borderRadius: "50%",
            animation: "ripple 1.8s ease-out infinite",
          },
          "&::after": {
            content: `""`,
            position: "absolute",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "white",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          },
        }}
      ></Box>
    </Stack>
  );
};

export default PulseDot;
