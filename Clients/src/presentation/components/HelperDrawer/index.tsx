import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Simple markdown parser for **bold** and *italic*
const parseMarkdown = (text: string) => {
  const parts = [];
  let currentIndex = 0;

  // Regular expression to match **bold** and *italic*
  const markdownRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    // Add the formatted text
    if (match[0].startsWith('**')) {
      // Bold text
      parts.push(
        <Typography
          key={match.index}
          component="span"
          sx={{ fontWeight: 'bold', fontSize: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
        >
          {match[2]}
        </Typography>
      );
    } else {
      // Italic text
      parts.push(
        <Typography
          key={match.index}
          component="span"
          sx={{ fontStyle: 'italic', fontSize: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
        >
          {match[3]}
        </Typography>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
};

interface HelperDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  whatItDoes: string;
  whyItMatters: string;
  quickActions: Array<{
    label: string;
    description: string;
    action?: () => void;
    primary?: boolean;
  }>;
  tips?: string[];
  useCases?: string[];
  keyFeatures?: string[];
}

const HelperDrawer: React.FC<HelperDrawerProps> = ({
  open,
  onClose,
  title,
  description,
  whatItDoes,
  whyItMatters,
  quickActions,
  tips = [],
  useCases = [],
  keyFeatures = []
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600 },
          height: 'calc(100vh - 24px)',
          margin: '12px 12px 12px 0',
          background: 'linear-gradient(180deg, #fafbff 0%, #f8fafc 100%)',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '12px',
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          pl: 8,
          pr: 6,
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle background pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              opacity: 0.5,
            }}
          />

          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="600" color="white" mb={1}>
                {title}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                ml: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, pl: 8, pr: 6, py: 6, overflow: 'auto' }}>
          {/* Description Box */}
          <Box sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary', lineHeight: 1.6, fontStyle: 'italic' }}>
              {description}
            </Typography>
          </Box>

          <Stack spacing={6}>

            {/* What it does */}
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#374151">
                  What it does
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.7 }}>
                {parseMarkdown(whatItDoes)}
              </Typography>
            </Box>

            {/* Key Features */}
            {keyFeatures.length > 0 && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="600" color="#374151">
                    Key features
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {keyFeatures.map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0,
                          mt: '8px',
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.6 }}>
                        {parseMarkdown(feature)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Why it matters */}
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#374151">
                  Why it matters
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.7 }}>
                {parseMarkdown(whyItMatters)}
              </Typography>
            </Box>

            {/* Quick Actions */}
            <Box>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#374151">
                  Quick actions
                </Typography>
              </Box>

              <Stack spacing={3}>
                {quickActions.map((action, index) => (
                  <Box key={index}>
                    <Typography variant="subtitle2" fontWeight="600" color="#374151" mb={1}>
                      {action.label}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.5 }}>
                      {action.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Common Use Cases */}
            {useCases.length > 0 && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="600" color="#374151">
                    Common use cases
                  </Typography>
                </Box>
                {/* Removed hardcoded text - use case intro is page-specific */}
                <Stack spacing={2}>
                  {useCases.slice(0, 2).map((useCase, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0,
                          mt: '8px',
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.6 }}>
                        {parseMarkdown(useCase)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Pro Tips */}
            {tips.length > 0 && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="600" color="#374151">
                    Pro tips
                  </Typography>
                </Box>
                {/* Removed hardcoded text - tips intro is page-specific */}
                <Stack spacing={2}>
                  {tips.slice(0, 3).map((tip, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0,
                          mt: '8px',
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.6 }}>
                        {parseMarkdown(tip)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default HelperDrawer;