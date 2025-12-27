/**
 * EntityGraphModal - Full-screen modal for viewing entity relationships
 *
 * Opens Entity Graph focused on a specific entity, allowing users to
 * explore relationships without leaving their current context.
 */

import React, { useEffect } from 'react';
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
// Import ReactFlow CSS at modal level to ensure it's available in the portal
import '@xyflow/react/dist/style.css';
// Import EntityGraph directly (not lazy) to avoid portal/context issues
import EntityGraph from '../../pages/EntityGraph';

export type FocusEntityType = 'model' | 'risk' | 'vendor' | 'useCase' | 'evidence' | 'framework';

interface EntityGraphModalProps {
  open: boolean;
  onClose: () => void;
  focusEntityId: string | number;
  focusEntityType: FocusEntityType;
  focusEntityLabel?: string;
}

// Inner component that uses the focus context
const EntityGraphModalInner: React.FC<EntityGraphModalProps> = ({
  open,
  onClose,
  focusEntityId,
  focusEntityType,
  focusEntityLabel,
}) => {
  const { setFocusEntity, clearFocus } = useEntityGraphFocus();
  const [isMounted, setIsMounted] = React.useState(false);

  // Delay rendering until modal is fully open to prevent NaN viewport issues
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setIsMounted(true), 100);
      return () => clearTimeout(timer);
    }
    setIsMounted(false);
    return undefined;
  }, [open]);

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
      useCase: 'Use case',
      evidence: 'Evidence',
      framework: 'Framework',
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
            minHeight: 400,
          }}
        >
          {isMounted ? (
            <EntityGraph />
          ) : (
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
          )}
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
