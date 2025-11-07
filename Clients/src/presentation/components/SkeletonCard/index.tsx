import React from "react";
import { Box, Stack } from "@mui/material";

interface SkeletonCardProps {
  /**
   * Width of the card. Can be a number (px) or string with units
   * @default 216 (60% of 360)
   */
  width?: number | string;
  /**
   * Whether to show the soft spotlight halo effect
   * @default true
   */
  showHalo?: boolean;
}

/**
 * Skeleton card stack component for empty states
 * Shows an animated stacked card design with pulsing skeleton elements
 * Default size is 60% of original design
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = 216, // 60% of 360
  showHalo = true
}) => {
  const pulseAnimation = {
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.72 }
    }
  };

  const floatAnimation = {
    '@keyframes float': {
      '0%, 100%': { transform: 'rotate(5deg) translate(12px, -20px)' },
      '50%': { transform: 'rotate(5deg) translate(12px, -24px)' }
    }
  };

  const cardStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: '57.6px', // 60% of 96px
    borderRadius: '12px', // 60% of 20px
    background: '#ffffff',
    boxShadow: '0 8px 30px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.05) inset',
    display: 'flex',
    gap: '9.6px', // 60% of 16px
    alignItems: 'center',
    padding: '9.6px' // 60% of 16px
  };

  const blockStyle = {
    width: '54px', // 60% of 90px
    height: '33.6px', // 60% of 56px
    borderRadius: '7.2px', // 60% of 12px
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    animation: 'pulse 1.6s ease-in-out infinite',
    ...pulseAnimation
  };

  const lineStyle = {
    height: '7.2px', // 60% of 12px
    borderRadius: '999px',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    animation: 'pulse 1.6s ease-in-out infinite',
    ...pulseAnimation
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Soft spotlight halo */}
      {showHalo && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              width: '260px',
              height: '260px',
              borderRadius: '999px',
              background: '#fff',
              filter: 'blur(60px)',
              opacity: 0.9
            }
          }}
          aria-hidden="true"
        />
      )}

      {/* Card stack */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Front card (now at bottom) */}
        <Box sx={cardStyle}>
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: '12px' }}>
            {/* Empty space to maintain card height */}
          </Stack>
        </Box>

        {/* Back card A */}
        <Box
          sx={{
            ...cardStyle,
            transform: 'rotate(-4deg) translate(-12px, -12px)',
            opacity: 0.75,
            filter: 'blur(.2px)',
            position: 'absolute',
            left: 0,
            top: 0
          }}
          aria-hidden="true"
        >
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: '12px' }}>
            <Box sx={{ ...lineStyle, width: '60%' }} />
            <Box sx={{ ...lineStyle, width: '80%' }} />
            <Box sx={{ ...lineStyle, width: '40%' }} />
          </Stack>
        </Box>

        {/* Back card B */}
        <Box
          sx={{
            ...cardStyle,
            transform: 'rotate(5deg) translate(12px, -20px)',
            opacity: 0.75,
            filter: 'blur(.3px)',
            position: 'absolute',
            left: 0,
            top: 0,
            animation: 'float 3s ease-in-out 5',
            ...floatAnimation
          }}
          aria-hidden="true"
        >
          <Box sx={blockStyle} />
          <Stack sx={{ flex: 1, gap: '12px' }}>
            <Box sx={{ ...lineStyle, width: '60%' }} />
            <Box sx={{ ...lineStyle, width: '80%' }} />
            <Box sx={{ ...lineStyle, width: '40%' }} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default SkeletonCard;
