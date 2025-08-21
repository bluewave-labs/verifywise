import { Stack, Typography } from "@mui/material";

const ISO27001Clause = () => {
  return (
    <Stack spacing={4}>
      <Typography
        variant="h5"
        sx={{
          color: "#1A1919",
          fontWeight: 600,
          mb: 2,
        }}
      >
        ISO 27001 Clauses
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "#666666",
          lineHeight: 1.6,
          mb: 4,
        }}
      >
        ISO 27001 consists of 10 main clauses that provide the framework for
        establishing, implementing, maintaining, and continually improving an
        Information Security Management System (ISMS).
      </Typography>
    </Stack>
  );
};

export default ISO27001Clause;
