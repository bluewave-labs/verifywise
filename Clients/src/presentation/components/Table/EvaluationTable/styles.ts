// Styles for EvaluationTable component

export const styles = {
  table: {
    minWidth: 650,
  },
  header: {
    backgroundColor: "#f8fafc",
  },
  row: {
    "&:nth-of-type(odd)": {
      backgroundColor: "#fafafa",
    },
  },
};

export const paginationStatus = {
  color: "#6B7280",
  fontSize: "0.875rem",
  fontWeight: 500,
};

export const paginationStyle = {
  "& .MuiTablePagination-toolbar": {
    paddingLeft: 0,
    paddingRight: 0,
  },
  "& .MuiTablePagination-selectLabel": {
    fontSize: "0.875rem",
    color: "#6B7280",
  },
  "& .MuiTablePagination-displayedRows": {
    fontSize: "0.875rem",
    color: "#6B7280",
  },
  "& .MuiTablePagination-select": {
    fontSize: "0.875rem",
  },
  "& .MuiTablePagination-actions": {
    "& .MuiIconButton-root": {
      color: "#6B7280",
    },
  },
};

export const paginationDropdown = {
  fontSize: "0.875rem",
  color: "#6B7280",
  fontWeight: 500,
};

export const paginationSelect = {
  fontSize: "0.875rem",
  color: "#6B7280",
  fontWeight: 500,
};

export const emptyData = {
  textAlign: "center" as const,
  padding: "40px 20px",
  border: "none",
};
