// PageHeaderExtended styles
export const pageHeaderTitleSectionStyle = {
  mt: "-14px",
};

export const pageHeaderSummaryCardsStyle = {
  mb: "-3px",
};

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

// Ghost style - transparent with borders
export const actionButtonsStyles = {
  search: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderColor: '#d0d5dd' },
  },
  approval_workflows: {
    backgroundColor: 'transparent',
    color: '#13715B',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(19, 113, 91, 0.08)', borderColor: '#13715B' },
  },
  integrations: {
    backgroundColor: 'transparent',
    color: '#8B5CF6',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.08)', borderColor: '#8B5CF6' },
    '&.Mui-disabled': { backgroundColor: 'transparent', color: '#8B5CF6', opacity: 0.5 },
  },
  automations: {
    backgroundColor: 'transparent',
    color: '#F97316',
    border: '1px solid #e5e5e5',
    '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)', borderColor: '#F97316' },
  },
};
