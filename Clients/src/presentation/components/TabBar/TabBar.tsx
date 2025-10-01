import React, { useState } from "react";
import { Box, Tab, Tabs, Paper } from "@mui/material";

export interface TabBarProps {
  tabs: string[];
  value?: number;
  onChange?: (event: React.SyntheticEvent, newValue: number) => void;
  variant?: "standard" | "scrollable" | "fullWidth";
  indicatorColor?: string;
  textColor?: string;
  selectedTextColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  sx?: object;
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  value: controlledValue,
  onChange,
  variant = "standard",
  indicatorColor = "#13715B",
  textColor = "#6B7280",
  selectedTextColor = "#13715B",
  backgroundColor = "#FCFCFD",
  borderColor = "#E5E7EB",
  sx = {},
}) => {
  const [internalValue, setInternalValue] = useState(0);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (onChange) {
      onChange(event, newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        boxShadow: 'none',
        ...sx
      }}
    >
      <Box sx={{ borderBottom: `1px solid ${borderColor}` }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          variant={variant}
          TabIndicatorProps={{ 
            style: { backgroundColor: indicatorColor } 
          }}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              color: textColor,
              fontWeight: 500,
              textTransform: 'none',
              minWidth: 120,
              '&.Mui-selected': {
                color: selectedTextColor,
                fontWeight: 600,
              },
              '& .MuiTouchRipple-root': {
                display: 'none',
              }
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index}
              label={tab} 
              {...a11yProps(index)} 
            />
          ))}
        </Tabs>
      </Box>
    </Paper>
  );
};

export default TabBar;