import React, { useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { Building2 } from 'lucide-react';
import { getBrandFetchUrl } from '../../../config/brandfetch.config';

interface VendorLogoProps {
  /** Vendor's website URL or domain */
  website: string;
  /** Vendor's name (used as fallback) */
  vendorName: string;
  /** Logo size in pixels (default: 32) */
  size?: number;
  /** Whether to show the vendor name next to the logo (default: true) */
  showName?: boolean;
}

/**
 * Vibrant color palette for avatar backgrounds
 * Each vendor gets a consistent color based on their name
 */
const COLOR_PALETTE = [
  { bg: '#EF4444', text: '#FFFFFF' }, // Red
  { bg: '#F59E0B', text: '#FFFFFF' }, // Amber
  { bg: '#10B981', text: '#FFFFFF' }, // Emerald
  { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Violet
  { bg: '#EC4899', text: '#FFFFFF' }, // Pink
  { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
  { bg: '#F97316', text: '#FFFFFF' }, // Orange
  { bg: '#14B8A6', text: '#FFFFFF' }, // Teal
  { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
  { bg: '#A855F7', text: '#FFFFFF' }, // Purple
  { bg: '#84CC16', text: '#FFFFFF' }, // Lime
];

/**
 * Generates a consistent color for a vendor based on their name
 * Uses a simple hash function to ensure the same vendor always gets the same color
 */
const getVendorColor = (vendorName: string): { bg: string; text: string } => {
  if (!vendorName) return COLOR_PALETTE[0];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < vendorName.length; i++) {
    hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

/**
 * VendorLogo Component
 *
 * Displays a vendor's logo fetched from BrandFetch API.
 * Falls back to a colorful letter avatar if the logo fails to load.
 *
 * @example
 * <VendorLogo
 *   website="https://apple.com"
 *   vendorName="Apple Inc."
 *   size={40}
 * />
 */
const VendorLogo: React.FC<VendorLogoProps> = ({
  website,
  vendorName,
  size = 32,
  showName = true,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);

  const brandFetchUrl = getBrandFetchUrl(website);
  const hasValidUrl = brandFetchUrl && website && website.trim() !== '';

  // Get first letter of vendor name for fallback
  const firstLetter = vendorName?.charAt(0)?.toUpperCase() || '?';

  // Get consistent color for this vendor
  const vendorColor = getVendorColor(vendorName);

  const handleImageLoad = () => {
    setLogoLoading(false);
    setLogoError(false);
  };

  const handleImageError = () => {
    setLogoLoading(false);
    setLogoError(true);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {/* Logo or Fallback Avatar */}
      {hasValidUrl && !logoError ? (
        <Box
          sx={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={brandFetchUrl}
            alt={`${vendorName} logo`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: logoLoading ? 'none' : 'block',
            }}
          />
          {logoLoading && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6',
              }}
            >
              <Building2 size={size * 0.5} color="#9CA3AF" />
            </Box>
          )}
        </Box>
      ) : (
        <Avatar
          sx={{
            width: size,
            height: size,
            backgroundColor: vendorColor.bg,
            color: vendorColor.text,
            fontSize: size * 0.5,
            fontWeight: 600,
            border: 'none',
          }}
        >
          {firstLetter}
        </Avatar>
      )}

      {/* Vendor Name */}
      {showName && (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 400,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vendorName}
        </Typography>
      )}
    </Box>
  );
};

export default VendorLogo;
