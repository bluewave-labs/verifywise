import { Stack, Box, Typography } from "@mui/material";
import { Bot, FileSearch } from "lucide-react";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  loading: boolean;
  newProject: {
    name: string;
    description: string;
    useCase: "chatbot" | "rag" | "agent";
  };
  onProjectChange: (updates: Partial<NewProjectModalProps["newProject"]>) => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  newProject,
  onProjectChange,
}: NewProjectModalProps) {
  return (
    <ModalStandard
      isOpen={isOpen}
      onClose={onClose}
      title="Create project"
      description="Create a new project to organize your LLM evaluations"
      onSubmit={onSubmit}
      submitButtonText="Create project"
      isSubmitting={loading || !newProject.name}
    >
      <Stack spacing={3}>
        <Field
          label="Project name"
          value={newProject.name}
          onChange={(e) => onProjectChange({ name: e.target.value })}
          placeholder="e.g., Coding Tasks Evaluation"
          isRequired
        />

        <Field
          label="Description"
          value={newProject.description}
          onChange={(e) => onProjectChange({ description: e.target.value })}
          placeholder="Brief description of this project..."
        />

        {/* LLM Use Case - card selection */}
        <Stack gap={1} className="select-wrapper">
          <Typography
            component="p"
            variant="body1"
            color="text.secondary"
            fontWeight={500}
            fontSize="13px"
            sx={{
              margin: 0,
              height: "22px",
              display: "flex",
              alignItems: "center",
            }}
          >
            LLM use case
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box
              onClick={() => onProjectChange({ useCase: "rag" })}
              sx={{
                border: "1px solid",
                borderColor: newProject.useCase === "rag" ? "#A7C4BC" : "#E5E7EB",
                borderRadius: 2,
                p: 2,
                cursor: "pointer",
                backgroundColor: newProject.useCase === "rag" ? "#F7F9F8" : "#FFFFFF",
                transition: "all 0.2s ease",
                boxShadow: newProject.useCase === "rag" ? "0 4px 10px rgba(0,0,0,0.05)" : "none",
                "&:hover": { borderColor: "#A7C4BC", backgroundColor: "#F7F9F8", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box sx={{ mt: 0.25 }}>
                  <FileSearch size={20} color="#13715B" />
                </Box>
                <Box>
                  <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>RAG</Box>
                  <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                    Evaluate retrieval-augmented generation: recall, precision, relevancy and faithfulness.
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box
              onClick={() => onProjectChange({ useCase: "chatbot" })}
              sx={{
                border: "1px solid",
                borderColor: newProject.useCase === "chatbot" ? "#A7C4BC" : "#E5E7EB",
                borderRadius: 2,
                p: 2,
                cursor: "pointer",
                backgroundColor: newProject.useCase === "chatbot" ? "#F7F9F8" : "#FFFFFF",
                transition: "all 0.2s ease",
                boxShadow: newProject.useCase === "chatbot" ? "0 4px 10px rgba(0,0,0,0.05)" : "none",
                "&:hover": { borderColor: "#A7C4BC", backgroundColor: "#F7F9F8", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box sx={{ mt: 0.25 }}>
                  <Bot size={20} color="#13715B" />
                </Box>
                <Box>
                  <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbots</Box>
                  <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                    Evaluate conversational experiences for coherence, correctness and safety.
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </ModalStandard>
  );
}
