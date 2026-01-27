/**
 * ModelActionMenu Component
 * 
 * A modern popover menu that appears when a user selects a model from the leaderboard.
 * Provides options to chat with the model, compare in Arena, or run an evaluation.
 */

import { Box, Paper, Typography, Stack } from "@mui/material";
import { MessageSquare, Swords, FlaskConical, Sparkles, ArrowRight } from "lucide-react";

export interface ModelInfo {
  model: string;
  provider: string;
}

export interface ModelActionMenuProps {
  model: ModelInfo;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onChat: (model: ModelInfo) => void;
  onCompare: (model: ModelInfo) => void;
  onEvaluate: (model: ModelInfo) => void;
}

interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  iconBg: string;
  hoverBg: string;
}

function ActionItem({ icon, label, description, onClick, iconBg, hoverBg }: ActionItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: "10px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          bgcolor: hoverBg,
          transform: "translateX(4px)",
          "& .action-arrow": {
            opacity: 1,
            transform: "translateX(0)",
          },
        },
        "&:active": {
          transform: "translateX(2px) scale(0.99)",
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          bgcolor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform 0.2s",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ 
            fontWeight: 600, 
            color: "#111827", 
            fontSize: 13,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ 
            color: "#6b7280", 
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          {description}
        </Typography>
      </Box>
      <ArrowRight 
        size={14} 
        color="#9ca3af"
        className="action-arrow"
        style={{
          opacity: 0,
          transform: "translateX(-4px)",
          transition: "all 0.2s",
        }}
      />
    </Box>
  );
}

// Helper to get provider color
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    "OpenAI": "#10a37f",
    "Anthropic": "#d97706",
    "Google": "#4285f4",
    "Mistral": "#ff7000",
    "xAI": "#1d9bf0",
    "Meta": "#0668E1",
  };
  return colors[provider] || "#6b7280";
}

export default function ModelActionMenu({
  model,
  anchorEl,
  onClose,
  onChat,
  onCompare,
  onEvaluate,
}: ModelActionMenuProps) {
  if (!anchorEl) return null;

  // Calculate position relative to anchor element
  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = 280;
  const menuHeight = 240;
  
  // Center horizontally relative to the row
  let left = rect.left + rect.width / 2 - menuWidth / 2;
  
  // Keep within screen bounds horizontally
  if (left < 16) left = 16;
  if (left + menuWidth > window.innerWidth - 16) {
    left = window.innerWidth - menuWidth - 16;
  }
  
  // Position above the row by default
  let top = rect.top - menuHeight - 8;
  
  // If not enough space above, position below
  if (top < 16) {
    top = rect.bottom + 8;
  }

  const providerColor = getProviderColor(model.provider);

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          bgcolor: "rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.15s ease",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      />
      
      {/* Menu */}
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left,
          top,
          width: menuWidth,
          zIndex: 1201,
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          animation: "slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes slideIn": {
            from: { 
              opacity: 0,
              transform: "translateY(8px) scale(0.96)",
            },
            to: { 
              opacity: 1,
              transform: "translateY(0) scale(1)",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${providerColor}08 0%, ${providerColor}03 100%)`,
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${providerColor}20 0%, ${providerColor}10 100%)`,
                border: `1px solid ${providerColor}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} color={providerColor} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  fontSize: 14,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {model.model}
              </Typography>
              <Typography 
                sx={{ 
                  color: providerColor, 
                  fontSize: 11, 
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {model.provider}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Actions */}
        <Stack sx={{ p: 1 }}>
          <ActionItem
            icon={<MessageSquare size={16} color="#059669" strokeWidth={2.5} />}
            label="Chat with Model"
            description="Test in playground"
            onClick={() => {
              onChat(model);
              onClose();
            }}
            iconBg="#ecfdf5"
            hoverBg="#f0fdf4"
          />
          
          <ActionItem
            icon={<Swords size={16} color="#7c3aed" strokeWidth={2.5} />}
            label="Compare in Arena"
            description="Head-to-head comparison"
            onClick={() => {
              onCompare(model);
              onClose();
            }}
            iconBg="#f5f3ff"
            hoverBg="#faf5ff"
          />
          
          <ActionItem
            icon={<FlaskConical size={16} color="#ea580c" strokeWidth={2.5} />}
            label="Run Evaluation"
            description="Evaluate with dataset"
            onClick={() => {
              onEvaluate(model);
              onClose();
            }}
            iconBg="#fff7ed"
            hoverBg="#fffbeb"
          />
        </Stack>
      </Paper>
    </>
  );
}
