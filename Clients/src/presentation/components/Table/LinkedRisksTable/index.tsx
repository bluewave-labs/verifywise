import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import singleTheme from "../../../themes/v1SingleTheme";
import TableHeader from "../TableHead";
import { TITLE_OF_COLUMNS } from "../../LinkedRisks/constants";
import placeholderImage from "../../../assets/imgs/empty-state.svg";

import LinkedRisksTableBody from "./TableBody";

import { tableWrapper, emptyData, styles } from "../styles";
import { ILinkedRisksTableProps } from "../../../../domain/interfaces/i.table";

const LinkedRisksTable: React.FC<ILinkedRisksTableProps> = ({
  projectRisksGroup,
  filteredRisksGroup,
  currentRisks,
  checkedRows,
  setCheckedRows,
  deletedRisks,
  setDeletedRisks,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <TableContainer>
      <Table
        sx={{
          ...singleTheme.tableStyles.primary.frame,
          ...tableWrapper,
        }}
      >
        <TableHeader columns={TITLE_OF_COLUMNS} />
        {projectRisksGroup.length > 0 ? (
          <>
            {filteredRisksGroup.length > 0 ? (
              <LinkedRisksTableBody
                rows={filteredRisksGroup}
                setCurrentPagingation={setCurrentPagingation}
                page={currentPage}
                currentRisks={currentRisks}
                checkedRows={checkedRows}
                setCheckedRows={setCheckedRows}
                deletedRisks={deletedRisks}
                setDeletedRisks={setDeletedRisks}
              />
            ) : (
              <>
                <TableRow>
                  <TableCell
                    colSpan={TITLE_OF_COLUMNS.length}
                    align="center"
                    sx={emptyData}
                  >
                    <img src={placeholderImage} alt="Placeholder" />
                    <Typography sx={styles.textBase}>
                      No risks found in database
                    </Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
          </>
        ) : (
          <>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={TITLE_OF_COLUMNS.length}
                  align="center"
                  sx={emptyData}
                >
                  <img src={placeholderImage} alt="Placeholder" />
                  <Typography sx={styles.textBase}>
                    There is currently no risk in this project.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </>
        )}
      </Table>
    </TableContainer>
  );
};

export default LinkedRisksTable;
