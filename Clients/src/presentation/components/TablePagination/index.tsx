/**
 * Component for pagination actions (first, previous, next, last).
 *
 * @component
 * @param {Object} props
 * @param {number} props.count - Total number of items.
 * @param {number} props.page - Current page number.
 * @param {number} props.rowsPerPage - Number of rows per page.
 * @param {function} props.onPageChange - Callback function to handle page change.
 *
 * @returns {JSX.Element} Pagination actions component.
 */

import { Box, Button } from "@mui/material";
import "../Table/index.css";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

const TablePaginationActions: React.FC<TablePaginationActionsProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
}) => {
  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 3 }}>
      <Button
        variant="text"
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <ChevronsLeft size={20} />
      </Button>
      <Button
        variant="text"
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        <ChevronLeft size={20} />
      </Button>
      <Button
        variant="text"
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <ChevronRight size={20} />
      </Button>
      <Button
        variant="text"
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <ChevronsRight size={20} />
      </Button>
    </Box>
  );
};

export default TablePaginationActions;
