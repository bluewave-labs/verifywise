import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { GroupBadge } from './GroupBy';
import { GroupedData } from '../../../application/hooks/useTableGrouping';

interface GroupedTableViewProps<T> {
  groupedData: GroupedData<T>[] | null;
  ungroupedData: T[];
  renderTable: (data: T[], options?: { hidePagination?: boolean }) => React.ReactNode;
}

/**
 * A reusable component for rendering tables with optional grouping.
 *
 * @example
 * ```tsx
 * <GroupedTableView
 *   groupedData={groupedTasks}
 *   ungroupedData={tasks}
 *   renderTable={(data, options) => (
 *     <TasksTable
 *       tasks={data}
 *       users={users}
 *       onArchive={handleDelete}
 *       onEdit={handleEdit}
 *       hidePagination={options?.hidePagination}
 *     />
 *   )}
 * />
 * ```
 */
export function GroupedTableView<T>({
  groupedData,
  ungroupedData,
  renderTable,
}: GroupedTableViewProps<T>): React.ReactElement {
  if (groupedData) {
    // Render grouped view
    return (
      <Stack spacing={3}>
        {groupedData.map(({ group, items }) => (
          <Box key={group}>
            <Typography
              sx={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
                paddingLeft: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {group}
              <GroupBadge count={items.length} />
            </Typography>
            {renderTable(items, { hidePagination: true })}
          </Box>
        ))}
      </Stack>
    );
  }

  // Render ungrouped view
  return <>{renderTable(ungroupedData)}</>;
}
