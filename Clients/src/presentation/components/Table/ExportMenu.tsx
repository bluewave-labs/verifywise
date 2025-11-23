import React, { useState } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FileText, FileSpreadsheet, MoreVertical } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../application/utils/tableExport';
import IconButton from '../IconButton';

interface ExportColumn {
  id: string;
  label: string;
}

interface ExportMenuProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  data,
  columns,
  filename = 'export',
  title
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportToCSV(data, columns, filename);
        break;
      case 'excel':
        exportToExcel(data, columns, filename);
        break;
      case 'pdf':
        exportToPDF(data, columns, filename, title);
        break;
    }
    handleClose();
  };

  return (
    <>
      <IconButton
        id="export"
        type="more"
        onClick={handleClick}
        aria-label="Export options"
      >
        <MoreVertical size={16} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: '180px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              mt: 1,
            }
          }
        }}
      >
        <MenuItem
          onClick={() => handleExport('pdf')}
          sx={{
            fontSize: '13px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <FileText size={16} />
          </ListItemIcon>
          <ListItemText
            primary="Export to PDF"
            primaryTypographyProps={{ fontSize: '13px' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('csv')}
          sx={{
            fontSize: '13px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <FileText size={16} />
          </ListItemIcon>
          <ListItemText
            primary="Export to CSV"
            primaryTypographyProps={{ fontSize: '13px' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('excel')}
          sx={{
            fontSize: '13px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <FileSpreadsheet size={16} />
          </ListItemIcon>
          <ListItemText
            primary="Export to XLSX"
            primaryTypographyProps={{ fontSize: '13px' }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};
