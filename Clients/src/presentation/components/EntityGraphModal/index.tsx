/**
 * EntityGraphModal - Full-screen modal for viewing entity relationships
 *
 * Opens Entity Graph focused on a specific entity, allowing users to
 * explore relationships without leaving their current context.
 */

import React, { Suspense, useEffect } from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { X } from 'lucide-react';
import { EntityGraphFocusProvider, useEntityGraphFocus } from '../../contexts/EntityGraphFocusContext';

export type FocusEntityType = 'model' | 'risk' | 'vendor' | 'control' | 'useCase' | 'evidence';

interface EntityGraphModalProps {
  open: boolean;
  onClose: () => void;
  focusEntityId: string | number;
  focusEntityType: FocusEntityType;
  focusEntityLabel?: string;
}

// Lazy load the full Entity Graph page
const EntityGraph = React.lazy(() => import('../../pages/EntityGraph'));

// Inner component that uses the focus context
const EntityGraphModalInner: React.FC<EntityGraphModalProps> = ({
  open,
  onClose,
  focusEntityId,
  focusEntityType,
  focusEntityLabel,
}) => {
  const { setFocusEntity, clearFocus } = useEntityGraphFocus();

  // Set focus entity when modal opens
  useEffect(() => {
    if (open) {
      setFocusEntity({
        id: `${focusEntityType}-${focusEntityId}`,
        type: focusEntityType,
        label: focusEntityLabel,
      });
    } else {
      clearFocus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focusEntityId, focusEntityType, focusEntityLabel]);

  const handleClose = () => {
    clearFocus();
    onClose();
  };

  const getEntityTypeLabel = (type: FocusEntityType): string => {
    const labels: Record<FocusEntityType, string> = {
      model: 'Model',
      risk: 'Risk',
      vendor: 'Vendor',
      control: 'Control',
      useCase: 'Use case',
      evidence: 'Evidence',
    };
    return labels[type] || type;
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="entity-graph-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          width: '95vw',
          height: '90vh',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: '#101828',
              }}
            >
              Entity relationships
            </Typography>
            {focusEntityLabel && (
              <>
                <Typography sx={{ color: '#667085', fontSize: 14 }}>•</Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: '#344054',
                    fontWeight: 500,
                  }}
                >
                  {getEntityTypeLabel(focusEntityType)}: {focusEntityLabel}
                </Typography>
              </>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" gap={1}>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: '#667085',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
              }}
            >
              <X size={20} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Content - Full Entity Graph */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            // Hide the page header/breadcrumbs in modal mode
            '& > div > div:first-of-type': {
              display: 'none', // Hide PageBreadcrumbs
            },
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 2,
                }}
              >
                <CircularProgress size={24} />
                <Typography sx={{ color: '#667085' }}>Loading graph...</Typography>
              </Box>
            }
          >
            <EntityGraph />
          </Suspense>
        </Box>
      </Box>
    </Modal>
  );
};

// Wrapper that provides the focus context
const EntityGraphModal: React.FC<EntityGraphModalProps> = (props) => {
  return (
    <EntityGraphFocusProvider>
      <EntityGraphModalInner {...props} />
    </EntityGraphFocusProvider>
  );
};

export default EntityGraphModal;
