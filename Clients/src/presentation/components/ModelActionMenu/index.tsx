/**
 * ModelActionMenu Component
 * 
 * A popover menu that appears when a user selects a model from the leaderboard.
 * Provides options to chat with the model, compare in Arena, or run an evaluation.
 */

import { Box, Paper, Typography, Stack, Divider, IconButton } from "@mui/material";
import { MessageSquare, Swords, FlaskConical, X } from "lucide-react";

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
  color: string;
  bgColor: string;
}

function ActionItem({ icon, label, description, onClick, color, bgColor }: ActionItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1.5,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: bgColor,
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "10px",
          bgcolor: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: "#111827", fontSize: 14 }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#6b7280", fontSize: 12 }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
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
  const menuWidth = 320;
  const menuHeight = 280;
  
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

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          bgcolor: "rgba(0, 0, 0, 0.1)",
        }}
      />
      
      {/* Menu */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          left,
          top,
          width: menuWidth,
          zIndex: 1201,
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#111827",
                fontSize: 15,
                fontFamily: "'SF Mono', 'Roboto Mono', monospace",
              }}
            >
              {model.model}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: 11 }}>
              {model.provider}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "#9ca3af", "&:hover": { bgcolor: "#f3f4f6" } }}
          >
            <X size={16} />
          </IconButton>
        </Box>

        {/* Actions */}
        <Stack sx={{ p: 1 }}>
          <ActionItem
            icon={<MessageSquare size={18} color="#059669" />}
            label="Chat with Model"
            description="Test the model in playground"
            onClick={() => {
              onChat(model);
              onClose();
            }}
            color="#059669"
            bgColor="#ecfdf5"
          />
          
          <ActionItem
            icon={<Swords size={18} color="#7c3aed" />}
            label="Compare in Arena"
            description="Run head-to-head comparison"
            onClick={() => {
              onCompare(model);
              onClose();
            }}
            color="#7c3aed"
            bgColor="#f5f3ff"
          />
          
          <ActionItem
            icon={<FlaskConical size={18} color="#ea580c" />}
            label="Run Evaluation"
            description="Evaluate with your dataset"
            onClick={() => {
              onEvaluate(model);
              onClose();
            }}
            color="#ea580c"
            bgColor="#fff7ed"
          />
        </Stack>

        {/* Footer hint */}
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: "#fafafa" }}>
          <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: 11 }}>
            Click anywhere outside to close
          </Typography>
        </Box>
      </Paper>
    </>
  );
}
