import { TableHead, TableRow, TableCell } from '@mui/material';
import singleTheme from '../../../themes/v1SingleTheme';

const TableHeader = ({ columns }: { columns: any[] }) => {
  return (
    <>
      <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}>
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {columns.map((column, index) => (
            <TableCell
              key={index}
              style={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(index === columns.length - 1
                  ? {
                      position: "sticky",
                      right: 0,
                      backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                    }
                  : {}),
              }}
            >
              {column}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    </>
  )
}

export default TableHeader