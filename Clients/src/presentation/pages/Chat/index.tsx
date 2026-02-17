import { useState, useEffect, useCallback } from "react";
import { Box, Stack, useTheme } from "@mui/material";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import AdvisorChat from "../../components/AdvisorChat";
import { getLLMKeys } from "../../../application/repository/llmKeys.repository";
import { LLMKeysModel } from "../../../domain/models/Common/llmKeys/llmKeys.model";

const LLM_KEY_STORAGE_KEY = "verifywise-advisor-llm-key";

const Chat = () => {
  const theme = useTheme();
  const [selectedLLMKeyId, setSelectedLLMKeyId] = useState<number | undefined>(
    () => {
      const saved = localStorage.getItem(LLM_KEY_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : undefined;
    }
  );
  const [llmKeys, setLLMKeys] = useState<LLMKeysModel[]>([]);
  const [hasLLMKeys, setHasLLMKeys] = useState<boolean | null>(null);
  const [isLoadingLLMKeys, setIsLoadingLLMKeys] = useState(true);

  useEffect(() => {
    const fetchLLMKeys = async () => {
      try {
        const response = await getLLMKeys();
        const keys =
          response.data.data?.map(
            (key: LLMKeysModel) => new LLMKeysModel(key)
          ) || [];
        setLLMKeys(keys);
        setHasLLMKeys(keys.length > 0);

        if (keys.length > 0) {
          const savedKeyExists =
            selectedLLMKeyId &&
            keys.some((k: LLMKeysModel) => k.id === selectedLLMKeyId);
          if (!savedKeyExists) {
            setSelectedLLMKeyId(keys[0].id);
            localStorage.setItem(LLM_KEY_STORAGE_KEY, String(keys[0].id));
          }
        }
      } catch (error) {
        console.error("Failed to fetch LLM keys:", error);
        setHasLLMKeys(false);
      } finally {
        setIsLoadingLLMKeys(false);
      }
    };

    fetchLLMKeys();
  }, []);

  const handleKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const keyId = parseInt(event.target.value, 10);
      setSelectedLLMKeyId(keyId);
      localStorage.setItem(LLM_KEY_STORAGE_KEY, String(keyId));
    },
    []
  );

  const llmKeySelector =
    !isLoadingLLMKeys && llmKeys.length > 1 ? (
      <select
        value={selectedLLMKeyId || ""}
        onChange={handleKeyChange}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: 13,
          padding: "6px 10px",
          borderRadius: 4,
          border: `1px solid ${theme.palette.border?.light || "#d0d5dd"}`,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          cursor: "pointer",
          outline: "none",
          height: 34,
        }}
        title="Select AI model"
      >
        {llmKeys.map((key) => (
          <option key={key.id} value={key.id}>
            {key.model}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <PageBreadcrumbs />

      <PageHeader
        title="AI advisor"
        description="Ask questions across all domains — risks, models, vendors, incidents, tasks, policies, and more."
        rightContent={llmKeySelector}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          pb: 2,
        }}
      >
        <AdvisorChat
          pageContext="chat"
          selectedLLMKeyId={selectedLLMKeyId}
          hasLLMKeys={hasLLMKeys}
          isLoadingLLMKeys={isLoadingLLMKeys}
        />
      </Box>
    </Stack>
  );
};

export default Chat;
