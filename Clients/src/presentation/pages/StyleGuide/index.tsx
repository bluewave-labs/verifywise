import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  TextCursorInput,
  ToggleLeft,
  Square,
  Table2,
  LayoutGrid,
  Palette,
  Type,
  Layers,
  MousePointer2,
} from "lucide-react";
import FormInputsSection from "./sections/FormInputsSection";
import ButtonsSection from "./sections/ButtonsSection";
import ColorsSection from "./sections/ColorsSection";
import TypographySection from "./sections/TypographySection";
import TablesSection from "./sections/TablesSection";
import CardsSection from "./sections/CardsSection";
import ModalsSection from "./sections/ModalsSection";
import TogglesSection from "./sections/TogglesSection";
import StatusSection from "./sections/StatusSection";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const StyleGuide: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();

  const activeSection = section || "form-inputs";

  const navItems: NavItem[] = [
    {
      id: "form-inputs",
      label: "Form inputs",
      icon: <TextCursorInput size={18} />,
      component: <FormInputsSection />,
    },
    {
      id: "buttons",
      label: "Buttons",
      icon: <MousePointer2 size={18} />,
      component: <ButtonsSection />,
    },
    {
      id: "colors",
      label: "Colors",
      icon: <Palette size={18} />,
      component: <ColorsSection />,
    },
    {
      id: "typography",
      label: "Typography",
      icon: <Type size={18} />,
      component: <TypographySection />,
    },
    {
      id: "tables",
      label: "Tables",
      icon: <Table2 size={18} />,
      component: <TablesSection />,
    },
    {
      id: "cards",
      label: "Cards & containers",
      icon: <LayoutGrid size={18} />,
      component: <CardsSection />,
    },
    {
      id: "modals",
      label: "Modals & drawers",
      icon: <Layers size={18} />,
      component: <ModalsSection />,
    },
    {
      id: "toggles",
      label: "Toggles & checkboxes",
      icon: <ToggleLeft size={18} />,
      component: <TogglesSection />,
    },
    {
      id: "status",
      label: "Status indicators",
      icon: <Square size={18} />,
      component: <StatusSection />,
    },
  ];

  const handleNavClick = (id: string) => {
    navigate(`/style-guide/${id}`);
  };

  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar Navigation */}
      <Box
        sx={{
          width: 240,
          minWidth: 240,
          borderRight: `1px solid ${theme.palette.border.light}`,
          backgroundColor: theme.palette.background.alt,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: "16px 20px", borderBottom: `1px solid ${theme.palette.border.light}` }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: 16,
              color: theme.palette.text.primary,
            }}
          >
            Style guide
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 12,
              color: theme.palette.text.tertiary,
              mt: "4px",
            }}
          >
            VerifyWise design system
          </Typography>
        </Box>

        <Stack sx={{ p: "12px", flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => (
            <Box
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: "10px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  activeSection === item.id
                    ? theme.palette.background.fill
                    : "transparent",
                color:
                  activeSection === item.id
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                fontWeight: activeSection === item.id ? 500 : 400,
                transition: "background-color 150ms ease",
                "&:hover": {
                  backgroundColor: theme.palette.background.fill,
                },
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: "inherit",
                  color: "inherit",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            p: "12px 16px",
            borderTop: `1px solid ${theme.palette.border.light}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: theme.palette.text.accent,
            }}
          >
            Dev only - Not for production
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: theme.palette.background.main,
        }}
      >
        {activeItem?.component}
      </Box>
    </Box>
  );
};

export default StyleGuide;
