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
 * VendorLogo Component
 *
 * Displays a vendor's logo fetched from BrandFetch API.
 * Falls back to the first letter of the vendor name if the logo fails to load.
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
            backgroundColor: '#F3F4F6',
            color: '#6B7280',
            fontSize: size * 0.5,
            fontWeight: 600,
            border: '1px solid #E5E7EB',
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
