import React, { useState } from 'react';
import { Menu, MenuItem, ListItemText, IconButton } from '@mui/material';
import { MoreVertical, ChevronRight } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, printTable } from '../../../application/utils/tableExport';
import pdfIcon from '../../assets/icons/pdf_icon.svg';
import csvIcon from '../../assets/icons/csv_icon.svg';
import xlsIcon from '../../assets/icons/xls_icon.svg';

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
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setExportAnchorEl(null);
  };

  const handleExportHover = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handlePrintHover = () => {
    setExportAnchorEl(null);
  };

  const handlePrint = () => {
    printTable(data, columns, title);
    handleClose();
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
        onClick={handleClick}
        aria-label="Export options"
        sx={{
          height: '34px',
          width: '34px',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f9fafb',
            borderColor: '#d1d5db',
          },
        }}
      >
        <MoreVertical size={16} color="#6b7280" />
      </IconButton>
      {/* Main Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: '160px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              mt: 1,
            }
          }
        }}
      >
        {/* Print Option */}
        <MenuItem
          onClick={handlePrint}
          onMouseEnter={handlePrintHover}
          sx={{
            fontSize: '13px',
            padding: '8px 12px',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <ListItemText
            primary="Print"
            primaryTypographyProps={{ fontSize: '13px' }}
          />
        </MenuItem>

        {/* Export Option with Submenu */}
        <MenuItem
          onMouseEnter={handleExportHover}
          sx={{
            fontSize: '13px',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: Boolean(exportAnchorEl) ? '#f9fafb' : 'transparent',
            '&:hover': {
              backgroundColor: '#f9fafb !important',
            }
          }}
        >
          <ListItemText
            primary="Export"
            primaryTypographyProps={{ fontSize: '13px' }}
          />
          <ChevronRight size={16} color="#6b7280" />
        </MenuItem>
      </Menu>

      {/* Export Submenu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            onMouseLeave: () => setExportAnchorEl(null),
            sx: {
              minWidth: '180px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              ml: 0.5,
            }
          }
        }}
      >
        <MenuItem
          onClick={() => handleExport('pdf')}
          sx={{
            fontSize: '13px',
            padding: '8px 12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <img src={pdfIcon} alt="PDF" width={16} height={16} style={{ flexShrink: 0 }} />
          <ListItemText
            primary="Export to PDF"
            primaryTypographyProps={{ fontSize: '13px' }}
            sx={{ margin: 0 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('csv')}
          sx={{
            fontSize: '13px',
            padding: '8px 12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <img src={csvIcon} alt="CSV" width={16} height={16} style={{ flexShrink: 0 }} />
          <ListItemText
            primary="Export to CSV"
            primaryTypographyProps={{ fontSize: '13px' }}
            sx={{ margin: 0 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleExport('excel')}
          sx={{
            fontSize: '13px',
            padding: '8px 12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: '#f9fafb',
            }
          }}
        >
          <img src={xlsIcon} alt="XLSX" width={16} height={16} style={{ flexShrink: 0 }} />
          <ListItemText
            primary="Export to XLSX"
            primaryTypographyProps={{ fontSize: '13px' }}
            sx={{ margin: 0 }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};
