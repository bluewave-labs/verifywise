import { Theme } from "@mui/material";

export const asideMenu = {
  flexShrink: 0,
  width: 200,
  transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
}

export const verticalDividerStyle = (theme: Theme) => ({
  borderColor: theme.palette.border.light,
  mx: 4,
  mr: 16,
  my: theme.spacing(16)
})

export const sidebarContainer = {
  alignSelf: "stretch"
}

export const sidebarMenuStyle = (theme: Theme) => ({
  backgroundColor: theme.palette.background.main,
  "& .selected-path, & >MuiListItemButton-root:hover": {
    backgroundColor: theme.palette.background.main,
  },
  "& .MuiList-root svg path": {
    stroke: theme.palette.text.tertiary,
  },
  "& p, & span, & .MuiListSubheader-root": {
    color: theme.palette.text.secondary,
  }
})

export const sidebarInnerStack = (theme: Theme) => ({
  pb: theme.spacing(12),
  position: "relative"
})

export const listStyle = (theme: Theme) => ({
  px: theme.spacing(0),
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  "&::-webkit-scrollbar": {
    width: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.border.light,
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.palette.border.dark,
  },
})

export const accordionStyle = (theme: Theme) => ({
  backgroundColor: "transparent",
  boxShadow: "none",
  border: "none",
  "&::before": {
    display: "none",
  },
  "& .MuiAccordionSummary-root": {
    minHeight: "unset !important",
    padding: "0 !important",
    px: `${theme.spacing(4)} !important`,
    pb: `${theme.spacing(4)} !important`,
  },
  "& .MuiAccordionSummary-content": {
    margin: "0 !important",
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: "0 !important",
  },
  "& .MuiAccordionDetails-root": {
    padding: 0,
  },
})

export const getAccordionStyleWithIndex = (theme: Theme, index: number) => ({
  ...accordionStyle(theme),
  "& .MuiAccordionSummary-root": {
    minHeight: "unset !important",
    padding: "0 !important",
    px: `${theme.spacing(4)} !important`,
    pb: `${theme.spacing(4)} !important`,
    mt: index === 1 ? theme.spacing(8) : theme.spacing(8),
  },
})

export const groupTypographyStyle = (theme: Theme) => ({
  color: theme.palette.text.disabled,
  fontSize: "12px",
  fontWeight: 400,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  opacity: 0.7,
})

export const tooltipStyle = {
  fontSize: 13
}

export const listItemButtonStyle = (theme: Theme, isSelected: boolean) => ({
  height: "32px",
  gap: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  px: theme.spacing(4),
  background: isSelected
    ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
    : "transparent",
  border: isSelected
    ? "1px solid #D8D8D8"
    : "1px solid transparent",
  "&:hover": {
    background: isSelected
      ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
      : "#F9F9F9",
    border: isSelected
      ? "1px solid #D8D8D8"
      : "1px solid transparent",
  },
  "&:hover svg": {
    color: "#13715B !important",
    stroke: "#13715B !important",
  },
  "&:hover svg path": {
    stroke: "#13715B !important",
  },
})

export const listItemTextStyle = {
  "& .MuiListItemText-primary": {
    fontSize: "13px",
  },
}

export const horizontalDividerStyle = (theme: Theme) => ({
  borderColor: theme.palette.border.light,
  mx: 4,
  mr: 16,
  width: '248px',
  mb: theme.spacing(12)
})

export const timelineContainer = {
  paddingLeft: 8,
  width: '548px'
}

export const stepCircleStyle = (isCompleted: boolean) => ({
  minWidth: '20px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isCompleted ? '#11725B' : 'transparent',
  border: isCompleted ? 'none' : '2px solid #CCCCCC',
})

export const stepContainerStyle = {
  flex: 1,
  mb: 2
}

export const stepDateStyle = {
  fontSize: 12,
  fontWeight: 400,
  color: "#999999"
}

export const stepTitleStyle = {
  fontWeight: 500,
  fontSize: 16
}

export const stepDividerStyle = {
  borderRightWidth: "0.5px",
  borderColor: "#E0E0E0",
  mt: 4,
  ml: 5,
  mr: 12,
  mb: 2,
}

export const stepDetailsStack = {
  flex: 1
}

export const approverNameStyle = {
  fontWeight: 500,
  fontSize: 14,
  mb: 2,
  color: "#999999"
}

export const seeDetailsLinkStyle = {
  color: "#13715B",
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: "underline",
  cursor: 'pointer',
  '&:hover': {
    color: "#0F5A47",
  },
  alignSelf: 'flex-start',
}

export const commentLabelStyle = {
  fontWeight: 600,
  fontSize: 12,
  color: "#999999"
}

export const commentTextStyle = {
  fontWeight: 500,
  fontSize: 14
}

export const commentFieldStyle = {
  '& .MuiOutlinedInput-root': {
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    '&:hover fieldset': {
      borderColor: '#D0D5DD',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#13715B',
    },
  },
}

export const withdrawalBodyStyle = {
  fontSize: 13
}

// StepDetailsModal styles
export const stepDetailsContainerStack = {
  spacing: 4
}

export const stepDetailFieldStack = {
  spacing: 1
}

export const stepDetailLabelStyle = {
  fontWeight: 600,
  fontSize: 14,
  color: "#344054"
}

export const stepDetailValueStyle = {
  fontSize: 14,
  color: "#475467"
}

export const stepDetailValueWithWrapStyle = {
  fontSize: 14,
  color: "#475467",
  whiteSpace: "pre-wrap" as const
}