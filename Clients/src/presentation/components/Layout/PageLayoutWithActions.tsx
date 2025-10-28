import React from 'react';
import { Box } from '@mui/material';
import PageBreadcrumbs from '../Breadcrumbs/PageBreadcrumbs';
import DashboardActionButtons from './DashboardActionButtons';
import { IBreadcrumbItem } from '../../../domain/interfaces/i.breadcrumbs';

interface PageLayoutWithActionsProps {
  children: React.ReactNode;
  breadcrumbItems?: IBreadcrumbItem[];
  showBreadcrumbs?: boolean;
  showActionButtons?: boolean;
  title?: string;
  description?: string;
  autoGenerateBreadcrumbs?: boolean;
  showCurrentPage?: boolean;
}

const PageLayoutWithActions: React.FC<PageLayoutWithActionsProps> = ({
  children,
  breadcrumbItems,
  showBreadcrumbs = true,
  showActionButtons = true,
  title,
  description,
  autoGenerateBreadcrumbs = true,
  showCurrentPage = true,
}) => {
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {showActionButtons && <DashboardActionButtons />}

      {showBreadcrumbs && (
        <PageBreadcrumbs
          items={breadcrumbItems}
          autoGenerate={autoGenerateBreadcrumbs}
          showCurrentPage={showCurrentPage}
        />
      )}

      {title && (
        <Box sx={{ mb: 3 }}>
          <Box
            component="h1"
            sx={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            {title}
          </Box>
          {description && (
            <Box
              component="p"
              sx={{
                fontSize: '14px',
                color: 'text.secondary',
                m: 0,
              }}
            >
              {description}
            </Box>
          )}
        </Box>
      )}

      {children}
    </Box>
  );
};

export default PageLayoutWithActions;