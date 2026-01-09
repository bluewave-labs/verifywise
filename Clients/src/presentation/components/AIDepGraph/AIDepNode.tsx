/**
 * @fileoverview AI Dependency Graph Node Component
 *
 * Custom node component for the AI Dependency Graph visualization.
 */

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box, Typography } from "@mui/material";
import {
  Package,
  Bot,
  Globe,
  Key,
  Database,
  Cpu,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import VWTooltip from "../VWTooltip";
import type { AIDepNodeData, DependencyNodeType } from "./types";
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, RISK_LEVEL_COLORS } from "./types";

// Icons for each node type
const nodeTypeIcons: Record<DependencyNodeType, LucideIcon> = {
  library: Package,
  model: Bot,
  api: Globe,
  secret: Key,
  rag: Database,
  agent: Cpu,
  repository: GitBranch,
};

const AIDepNode: React.FC<NodeProps> = ({
  data,
  sourcePosition,
  targetPosition,
}) => {
  const nodeData = data as unknown as AIDepNodeData;
  const IconComponent = nodeTypeIcons[nodeData.nodeType] || Package;
  const color = NODE_TYPE_COLORS[nodeData.nodeType] || "#667085";
  const riskColor = RISK_LEVEL_COLORS[nodeData.riskLevel];
  const typeLabel = NODE_TYPE_LABELS[nodeData.nodeType];

  // Node size based on connections
  const connections = nodeData.connectionCount || 0;
  const sizeScale =
    connections > 10 ? 1.15 : connections > 5 ? 1.08 : connections > 2 ? 1.0 : 0.95;
  const minWidth = Math.round(130 * sizeScale);
  const maxWidth = Math.round(200 * sizeScale);

  // Build tooltip content
  const tooltipContent = (
    <Box sx={{ fontSize: 12 }}>
      <Box sx={{ mb: 1 }}>
        <strong>Type:</strong> {typeLabel}
      </Box>
      {nodeData.sublabel && (
        <Box sx={{ mb: 1 }}>
          <strong>Provider:</strong> {nodeData.sublabel}
        </Box>
      )}
      <Box sx={{ mb: 1 }}>
        <strong>Confidence:</strong>{" "}
        <span style={{ textTransform: "capitalize" }}>{nodeData.confidence}</span>
      </Box>
      <Box sx={{ mb: 1 }}>
        <strong>Risk level:</strong>{" "}
        <span style={{ color: riskColor, textTransform: "capitalize" }}>
          {nodeData.riskLevel}
        </span>
      </Box>
      <Box>
        <strong>Files:</strong> {nodeData.fileCount}
      </Box>
      {nodeData.governanceStatus && (
        <Box sx={{ mt: 1 }}>
          <strong>Status:</strong>{" "}
          <span style={{ textTransform: "capitalize" }}>
            {nodeData.governanceStatus}
          </span>
        </Box>
      )}
    </Box>
  );

  return (
    <VWTooltip header={nodeData.label} content={tooltipContent} placement="top" maxWidth={300}>
      <Box
        sx={{
          backgroundColor: nodeData.isHighlighted ? "#fffbeb" : "white",
          border: nodeData.isHighlighted
            ? "3px solid #f59e0b"
            : `2px solid ${color}`,
          borderRadius: "4px",
          padding: "8px 12px",
          minWidth: minWidth,
          maxWidth: maxWidth,
          boxShadow: nodeData.isHighlighted
            ? "0 0 0 4px rgba(245, 158, 11, 0.3), 0 4px 12px rgba(0,0,0,0.15)"
            : "0 2px 4px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "all 0.3s ease-in-out",
          transform: nodeData.isHighlighted ? "scale(1.05)" : "scale(1)",
          position: "relative",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transform: "translateY(-1px)",
          },
        }}
      >
        <Handle
          type="target"
          position={targetPosition || Position.Left}
          style={{
            background: color,
            border: "none",
            width: 8,
            height: 8,
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: "4px",
              p: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent size={14} color="white" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                color: "#344054",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {nodeData.label}
            </Typography>
            {nodeData.sublabel && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: 9,
                  color: "#667085",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nodeData.sublabel}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Risk level indicator */}
        <Box
          sx={{
            mt: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: riskColor,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontSize: 9,
              color: riskColor,
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {nodeData.riskLevel} risk
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: 9,
              color: "#667085",
              ml: "auto",
            }}
          >
            {nodeData.fileCount} {nodeData.fileCount === 1 ? "file" : "files"}
          </Typography>
        </Box>

        <Handle
          type="source"
          position={sourcePosition || Position.Right}
          style={{
            background: color,
            border: "none",
            width: 8,
            height: 8,
          }}
        />
      </Box>
    </VWTooltip>
  );
};

export default memo(AIDepNode);
