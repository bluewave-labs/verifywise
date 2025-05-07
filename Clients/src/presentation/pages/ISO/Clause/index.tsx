import { Stack, Typography } from "@mui/material";

const ISO42001ClauseList = [
  {
    id: 1,
    title: "Management System",
    clauses: [
      {
        number: 4,
        title: "Context of the Organization",
      },
      {
        number: 5,
        title: "Leadership",
      },
      {
        number: 6,
        title: "Planning",
      },
      {
        number: 7,
        title: "Support",
      },
      {
        number: 8,
        title: "Operation",
      },
      {
        number: 9,
        title: "Performance Evaluation",
      },
      {
        number: 10,
        title: "Improvement",
      },
    ],
  },
];

const ISO42001Clauses = () => {
  return (
    <Stack className="iso-42001-clauses">
      {ISO42001ClauseList.map((clause) => (
        <Typography
          key={clause.id}
          sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
        >
          {clause.title} {" Clauses"}
        </Typography>
      ))}
    </Stack>
  );
};

export default ISO42001Clauses;
