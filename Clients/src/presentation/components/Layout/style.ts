// ApprovalButton styles
export const approvalButtonStyle = {
  background: '#F4F4F4',
  color: '#344054',
  fontWeight: 500,
  fontSize: '13px',
  height: '32px',
  minHeight: '32px',
  padding: '8px 16px',
  borderRadius: '4px',
  textTransform: 'none' as const,
  '&:hover': { color: '#13715B' },
  transition: 'all 0.2s ease',
};

export const approvalCountBadgeStyle = {
  backgroundColor: '#CBCFD7',
  color: '#374151',
  px: '6px',
  py: '4px',
  ml: '8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1,
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minWidth: '20px',
  textAlign: 'center' as const,
};
