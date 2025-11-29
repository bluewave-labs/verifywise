import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableContainerProps,
} from '@mui/material';
import ChatIconColumn from '../ChatIconColumn';

export interface TableColumn {
  id: string;
  label: string;
  render: (row: any) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface TableWithCommentsProps {
  tableId: string;
  columns: TableColumn[];
  data: any[];
  getRowId: (row: any) => string | number;
  getRowLabel: (row: any) => string;
  getRowMetadata?: (row: any) => Record<string, any>;
  getMessageCount?: (row: any) => number;
  getFileCount?: (row: any) => number;
  hasUnreadMessages?: (row: any) => boolean;
  onRowClick?: (row: any) => void;
  containerProps?: TableContainerProps;
}

/**
 * TableWithComments - Automatically adds a comments column to any table
 *
 * This component simplifies table integration by automatically adding the
 * chat icon column as the first column. Just pass your columns and data.
 *
 * @example
 * ```tsx
 * <TableWithComments
 *   tableId="risk-management"
 *   columns={[
 *     { id: 'title', label: 'Title', render: (row) => row.title },
 *     { id: 'status', label: 'Status', render: (row) => row.status }
 *   ]}
 *   data={risks}
 *   getRowId={(row) => row.id}
 *   getRowLabel={(row) => row.title}
 *   getMessageCount={(row) => row.commentCount}
 * />
 * ```
 */
const TableWithComments: React.FC<TableWithCommentsProps> = ({
  tableId,
  columns,
  data,
  getRowId,
  getRowLabel,
  getRowMetadata,
  getMessageCount,
  getFileCount,
  hasUnreadMessages,
  onRowClick,
  containerProps = {},
}) => {
  return (
    <TableContainer component={Paper} {...containerProps}>
      <Table>
        <TableHead>
          <TableRow>
            {/* Comments column - no header */}
            <TableCell sx={{ width: 48 }} />

            {/* User-defined columns */}
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                sx={{ width: column.width }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => {
            const rowId = getRowId(row);
            const rowLabel = getRowLabel(row);
            const metadata = getRowMetadata?.(row);
            const messageCount = getMessageCount?.(row) || 0;
            const fileCount = getFileCount?.(row) || 0;
            const hasUnread = hasUnreadMessages?.(row) || false;

            return (
              <TableRow
                key={rowId}
                onClick={() => onRowClick?.(row)}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  },
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {/* Comments icon column */}
                <TableCell sx={{ padding: 0 }}>
                  <ChatIconColumn
                    tableId={tableId}
                    rowId={rowId}
                    rowLabel={rowLabel}
                    metadata={metadata}
                    hasUnreadMessages={hasUnread}
                    messageCount={messageCount}
                    fileCount={fileCount}
                  />
                </TableCell>

                {/* User-defined columns */}
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableWithComments;
