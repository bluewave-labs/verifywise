import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { ChevronDown, ChevronRight, Copy, Check, Lock, Send } from 'lucide-react';

interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
}

interface Response {
  status: number;
  description: string;
  example?: string;
}

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  requiresAuth?: boolean;
  parameters?: Parameter[];
  requestBody?: Record<string, string>;
  responses?: Response[];
}

// Colors aligned with StyleGuide design system
const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: '#ecfdf3', text: '#079455', border: '#d4f4e1' },
  POST: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  PUT: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  PATCH: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  DELETE: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const EndpointCard: React.FC<EndpointCardProps> = ({
  method,
  path,
  summary,
  description,
  requiresAuth = false,
  parameters = [],
  requestBody,
  responses = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tryItExpanded, setTryItExpanded] = useState(false);
  const [requestBodyValue, setRequestBodyValue] = useState(
    requestBody ? JSON.stringify(requestBody, null, 2) : ''
  );
  const [responseValue, setResponseValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const colors = methodColors[method];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`/api${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTryIt = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setResponseValue(JSON.stringify({
        message: "ok",
        data: { example: "This is a simulated response" }
      }, null, 2));
      setIsLoading(false);
    }, 500);
  };

  return (
    <Box
      sx={{
        border: '1px solid #d0d5dd',
        borderRadius: '4px',
        mb: '12px',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease',
        '&:hover': {
          boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06)',
        },
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          p: '10px 12px',
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#f9fafb' : '#fff',
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: '#f9fafb',
          },
        }}
      >
        {/* Expand Icon */}
        <Box sx={{ color: '#667085', display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </Box>

        {/* Method Badge */}
        <Box
          sx={{
            px: '6px',
            py: '2px',
            borderRadius: '4px',
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            minWidth: 52,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "'Fira Code', monospace",
            }}
          >
            {method}
          </Typography>
        </Box>

        {/* Path */}
        <Typography
          sx={{
            fontSize: 12,
            fontFamily: "'Fira Code', monospace",
            color: '#1c2130',
            flex: 1,
          }}
        >
          {path}
        </Typography>

        {/* Auth Badge */}
        {requiresAuth && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              px: '5px',
              py: '1px',
              borderRadius: '4px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
            }}
          >
            <Lock size={9} color="#d97706" />
            <Typography sx={{ fontSize: 9, fontWeight: 500, color: '#d97706' }}>
              Auth
            </Typography>
          </Box>
        )}

        {/* Summary */}
        <Typography
          sx={{
            fontSize: 12,
            color: '#475467',
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {summary}
        </Typography>
      </Box>

      {/* Expanded Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ borderTop: '1px solid #eaecf0' }}>
          {/* Description */}
          {description && (
            <Box sx={{ p: '12px 16px', borderBottom: '1px solid #eaecf0' }}>
              <Typography sx={{ fontSize: 12, color: '#475467', lineHeight: 1.6 }}>
                {description}
              </Typography>
            </Box>
          )}

          {/* Copy Path */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: '10px 16px',
              backgroundColor: '#1e1e1e',
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontFamily: "'Fira Code', monospace",
                color: '#e5e5e5',
              }}
            >
              <Box component="span" sx={{ color: colors.text }}>{method}</Box>
              {' '}/api{path}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              sx={{
                color: copied ? '#4ade80' : '#9ca3af',
                p: '4px',
                '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </IconButton>
          </Box>

          {/* Parameters */}
          {parameters.length > 0 && (
            <Box sx={{ p: '12px 16px', borderTop: '1px solid #eaecf0' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1c2130', mb: '8px' }}>
                Parameters
              </Typography>
              <Box
                sx={{
                  border: '1px solid #eaecf0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {/* Table Header */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '100px 60px 70px 1fr',
                    gap: '8px',
                    p: '6px 10px',
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #eaecf0',
                  }}
                >
                  <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#475467', textTransform: 'uppercase' }}>Name</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#475467', textTransform: 'uppercase' }}>In</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#475467', textTransform: 'uppercase' }}>Type</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#475467', textTransform: 'uppercase' }}>Description</Typography>
                </Box>
                {/* Table Rows */}
                {parameters.map((param, index) => (
                  <Box
                    key={param.name}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '100px 60px 70px 1fr',
                      gap: '8px',
                      p: '8px 10px',
                      borderBottom: index < parameters.length - 1 ? '1px solid #eaecf0' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontFamily: "'Fira Code', monospace",
                          color: '#1c2130',
                        }}
                      >
                        {param.name}
                      </Typography>
                      {param.required && (
                        <Typography sx={{ fontSize: 9, color: '#dc2626' }}>*</Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 11, color: '#475467' }}>{param.in}</Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontFamily: "'Fira Code', monospace",
                        color: '#7c3aed',
                      }}
                    >
                      {param.type}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#475467' }}>{param.description}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Request Body */}
          {requestBody && (
            <Box sx={{ p: '12px 16px', borderTop: '1px solid #eaecf0' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1c2130', mb: '8px' }}>
                Request body
              </Typography>
              <Box
                sx={{
                  p: '10px 12px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 11,
                  color: '#e5e5e5',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(requestBody, null, 2)}
              </Box>
            </Box>
          )}

          {/* Responses */}
          {responses.length > 0 && (
            <Box sx={{ p: '12px 16px', borderTop: '1px solid #eaecf0' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1c2130', mb: '8px' }}>
                Responses
              </Typography>
              {responses.map((response) => (
                <Box
                  key={response.status}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    mb: '6px',
                  }}
                >
                  <Box
                    sx={{
                      px: '6px',
                      py: '1px',
                      borderRadius: '4px',
                      backgroundColor: response.status < 300 ? '#ecfdf3' : response.status < 500 ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${response.status < 300 ? '#d4f4e1' : response.status < 500 ? '#fecaca' : '#fde68a'}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: "'Fira Code', monospace",
                        color: response.status < 300 ? '#079455' : response.status < 500 ? '#dc2626' : '#d97706',
                      }}
                    >
                      {response.status}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: '#475467' }}>
                    {response.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Try It Out */}
          <Box sx={{ p: '12px 16px', borderTop: '1px solid #eaecf0', backgroundColor: '#fcfcfd' }}>
            <Box
              onClick={() => setTryItExpanded(!tryItExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Send size={12} color="#13715B" />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#13715B' }}>
                Try it out
              </Typography>
              {tryItExpanded ? (
                <ChevronDown size={12} color="#13715B" />
              ) : (
                <ChevronRight size={12} color="#13715B" />
              )}
            </Box>

            <Collapse in={tryItExpanded}>
              <Box sx={{ mt: '12px' }}>
                {requestBody && (
                  <Box sx={{ mb: '10px' }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 500, color: '#475467', mb: '6px' }}>
                      Request body
                    </Typography>
                    <textarea
                      value={requestBodyValue}
                      onChange={(e) => setRequestBodyValue(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: 100,
                        padding: '10px 12px',
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 11,
                        border: '1px solid #d0d5dd',
                        borderRadius: 4,
                        backgroundColor: '#fff',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                  </Box>
                )}

                <Box
                  onClick={handleTryIt}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    px: '12px',
                    py: '6px',
                    backgroundColor: '#13715B',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'background-color 150ms ease',
                    '&:hover': {
                      backgroundColor: '#0f604d',
                    },
                  }}
                >
                  <Send size={12} />
                  {isLoading ? 'Sending...' : 'Send request'}
                </Box>

                {responseValue && (
                  <Box sx={{ mt: '12px' }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 500, color: '#475467', mb: '6px' }}>
                      Response
                    </Typography>
                    <Box
                      sx={{
                        p: '10px 12px',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '4px',
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 11,
                        color: '#4ade80',
                        whiteSpace: 'pre',
                        overflow: 'auto',
                        maxHeight: 180,
                      }}
                    >
                      {responseValue}
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EndpointCard;
