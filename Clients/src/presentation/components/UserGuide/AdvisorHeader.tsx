import { FC, useEffect, useState } from "react";
import { X } from "lucide-react";
import { colors, typography, spacing, border } from "./styles/theme";
import { getLLMKeys } from "../../../application/repository/llmKeys.repository";
import { LLMKeysModel } from "../../../domain/models/Common/llmKeys/llmKeys.model";

interface AdvisorHeaderProps {
  onClose: () => void;
  selectedLLMKeyId?: number;
  onLLMKeyChange?: (keyId: number) => void;
}

const AdvisorHeader: FC<AdvisorHeaderProps> = ({
  onClose,
  selectedLLMKeyId,
  onLLMKeyChange,
}) => {
  const [llmKeys, setLLMKeys] = useState<LLMKeysModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLLMKeys = async () => {
      try {
        const response = await getLLMKeys();
        const keys =
          response.data.data?.map((key: any) => new LLMKeysModel(key)) || [];
        setLLMKeys(keys);

        // Auto-select first key if none selected
        if (keys.length > 0 && !selectedLLMKeyId && onLLMKeyChange) {
          onLLMKeyChange(keys[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch LLM keys:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLLMKeys();
  }, [selectedLLMKeyId, onLLMKeyChange]);

  const handleKeyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const keyId = parseInt(event.target.value);
    if (onLLMKeyChange) {
      onLLMKeyChange(keyId);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.background.white,
        borderBottom: border.default,
        padding: `${spacing.sm} ${spacing.md}`,
      }}
    >
      {/* Main header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Advisor
        </span>

        {/* Right side: LLM Key Selector and Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            flexShrink: 0,
          }}
        >
          {/* LLM Key Dropdown - only show if more than 1 key */}
          {!loading && llmKeys.length > 1 && (
            <select
              value={selectedLLMKeyId || ""}
              onChange={handleKeyChange}
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.xs,
                padding: `4px 8px`,
                borderRadius: border.radius,
                border: `1px solid ${colors.border?.default || "#e5e7eb"}`,
                backgroundColor: colors.background.white,
                color: colors.text.primary,
                cursor: "pointer",
                outline: "none",
              }}
              title="Select AI Model"
            >
              {llmKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.model}
                </option>
              ))}
            </select>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="header-icon-button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              backgroundColor: "transparent",
              border: "none",
              borderRadius: border.radius,
              cursor: "pointer",
              color: colors.text.secondary,
            }}
            title="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorHeader;
