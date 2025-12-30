import { FC } from "react";
import { Stack, Tooltip, Box, Typography } from "@mui/material";
import { Shield, FlaskConical, Network } from "lucide-react";
import { AppModule } from "../../../application/redux/ui/uiSlice";
import "./index.css";

interface AppSwitcherProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
}

interface ModuleItem {
  id: AppModule;
  icon: React.ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
}

const modules: ModuleItem[] = [
  {
    id: "main",
    icon: <Shield size={16} strokeWidth={1.5} />,
    label: "Governance",
    description: "Centralized AI governance, risk, and compliance platform",
  },
  {
    id: "evals",
    icon: <FlaskConical size={16} strokeWidth={1.5} />,
    label: "LLM Evals",
    description: "Evaluate LLM quality, performance and reliability over time",
  },
  {
    id: "gateway",
    icon: <Network size={16} strokeWidth={1.5} />,
    label: "Gateway",
    description:
      "Control, monitor, and govern all LLM traffic across your organization.",
    disabled: true,
  },
];

const AppSwitcher: FC<AppSwitcherProps> = ({
  activeModule,
  onModuleChange,
}) => {
  return (
    <Stack className="app-switcher">
      <Stack className="app-switcher-modules">
        {modules.map((module) => (
          <Tooltip
            key={module.id}
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, mb: 0.5 }}>
                  {module.label}
                  {module.disabled && " (Coming soon)"}
                </Typography>
                <Typography sx={{ fontSize: "11px", opacity: 0.9 }}>
                  {module.description}
                </Typography>
              </Box>
            }
            placement="right"
            arrow
            enterDelay={1000}
            enterNextDelay={1000}
            disableInteractive
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "#232340",
                  maxWidth: 220,
                  "& .MuiTooltip-arrow": {
                    color: "#232340",
                  },
                },
              },
            }}
          >
            {module.disabled ? (
              <span style={{ display: "inline-block" }}>
                <button
                  className={`app-switcher-icon ${
                    activeModule === module.id ? "active" : ""
                  } ${module.disabled ? "disabled" : ""}`}
                  onClick={() => !module.disabled && onModuleChange(module.id)}
                  disabled={module.disabled}
                  aria-label={module.label}
                >
                  {module.icon}
                </button>
              </span>
            ) : (
              <button
                className={`app-switcher-icon ${
                  activeModule === module.id ? "active" : ""
                } ${module.disabled ? "disabled" : ""}`}
                onClick={() => !module.disabled && onModuleChange(module.id)}
                disabled={module.disabled}
                aria-label={module.label}
              >
                {module.icon}
              </button>
            )}
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
};

export default AppSwitcher;
