import React from "react";
import { Box, Button, Stack } from "@mui/material";

interface Tab {
  id: number;
  label: string;
  content: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: number;
  onTabChange: (tabId: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <Box sx={{ 
      borderBottom: "1px solid #E5E7EB",
      backgroundColor: "#FCFCFD"
    }}>
      <Stack direction="row" spacing={0}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            sx={{
              px: 3,
              py: 1.5,
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "#13715B" : "#6B7280",
              backgroundColor: "transparent",
              borderRadius: 0,
              borderBottom: activeTab === tab.id ? "2px solid #13715B" : "2px solid transparent",
              textTransform: "none",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "#F9FAFB",
                color: activeTab === tab.id ? "#13715B" : "#374151",
              },
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default TabBar;