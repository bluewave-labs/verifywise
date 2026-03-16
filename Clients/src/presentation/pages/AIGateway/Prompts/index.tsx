import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import { CirclePlus, Trash2, BookOpen, FileText, Link } from "lucide-react";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Chip from "../../../components/Chip";
import Field from "../../../components/Inputs/Field";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { displayFormattedDate } from "../../../tools/isoDateToString";
import palette from "../../../themes/palette";
import { useCardSx, slugify, ProviderIcon } from "../shared";

interface Prompt {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  published_version: number | null;
  published_model: string | null;
  published_status: string | null;
  version_count: number;
  updated_at: string;
}

export default function PromptsPage() {
  const cardSx = useCardSx();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const loadData = useCallback(async () => {
    try {
      const res = await apiServices.get("/ai-gateway/prompts");
      setPrompts(res?.data?.data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNameChange = (value: string) => {
    setForm((p) => ({ ...p, name: value, slug: slugify(value) }));
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setFormError("");
  };

  const handleCreate = async () => {
    if (!form.name || !form.slug) {
      setFormError("Name is required");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await apiServices.post("/ai-gateway/prompts", {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
      });
      const created = res?.data?.data;
      setIsCreateOpen(false);
      setForm({ name: "", slug: "", description: "" });
      if (created?.id) {
        navigate(`/ai-gateway/prompts/${created.id}`);
      } else {
        loadData();
      }
    } catch (err: any) {
      setFormError(
        err?.response?.data?.data || err?.response?.data?.message || "Failed to create prompt"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiServices.delete(`/ai-gateway/prompts/${deleteTarget.id}`);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // silently handle
    }
  };

  if (loading) return null;

  if (prompts.length === 0 && !isCreateOpen) {
    return (
      <Box sx={{ p: 2 }}>
        <PageHeaderExtended
          entity="ai-gateway-prompts"
          actionButton={
            <CustomizableButton
              text="Create prompt"
              icon={<CirclePlus size={14} strokeWidth={1.5} />}
              onClick={() => setIsCreateOpen(true)}
              sx={{ height: 34 }}
            />
          }
        />
        <EmptyState
          icon={BookOpen}
          message="No prompts yet. Create your first prompt template to centralize and version-control system instructions."
        >
          <EmptyStateTip
            icon={FileText}
            title="Prompts are reusable message templates"
            description="Define system and user messages with {{variables}} that get resolved at request time. Each prompt tracks versions so you can test, compare, and roll back."
          />
          <EmptyStateTip
            icon={Link}
            title="Bind prompts to endpoints"
            description="Once published, a prompt can be bound to any endpoint. Every request through that endpoint automatically uses the prompt's messages as a base."
          />
        </EmptyState>

        <StandardModal
          isOpen={isCreateOpen}
          onClose={closeCreateModal}
          title="Create prompt"
          description="Set up a new prompt template with a name and slug."
          onSubmit={handleCreate}
          submitButtonText="Create"
          isSubmitting={isSubmitting}
        >
          <Stack spacing={6}>
            {formError && (
              <Typography color="error" fontSize={13}>{formError}</Typography>
            )}
            <Field label="Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Customer support agent" />
            <Field label="Slug" value={form.slug} onChange={(v) => setForm((p) => ({ ...p, slug: v }))} placeholder="e.g. customer-support" />
            <Field label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Optional description" />
          </Stack>
        </StandardModal>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <PageHeaderExtended
        entity="ai-gateway-prompts"
        actionButton={
          <CustomizableButton
            text="Create prompt"
            icon={<CirclePlus size={14} strokeWidth={1.5} />}
            onClick={() => setIsCreateOpen(true)}
            sx={{ height: 34 }}
          />
        }
      />

      <Box sx={{ ...cardSx, p: 0, mt: 2 }}>
        {/* Header row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 48px",
            px: 2,
            py: 1,
            borderBottom: `1px solid ${palette.border.light}`,
          }}
        >
          {["Name", "Slug", "Version", "Model", "Updated"].map((h) => (
            <Typography key={h} fontSize={12} fontWeight={600} color="text.secondary">
              {h}
            </Typography>
          ))}
          <span />
        </Box>

        {/* Rows */}
        {prompts.map((p) => {
          const provider = p.published_model?.includes("/")
            ? p.published_model.split("/")[0]
            : "";
          return (
            <Box
              key={p.id}
              onClick={() => navigate(`/ai-gateway/prompts/${p.id}`)}
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 48px",
                px: 2,
                py: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
                borderBottom: `1px solid ${palette.border.light}`,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography fontSize={13} fontWeight={500}>{p.name}</Typography>
                {p.description && (
                  <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }} noWrap>
                    {p.description}
                  </Typography>
                )}
              </Box>
              <Typography fontSize={13} color="text.secondary" fontFamily="monospace">
                {p.slug}
              </Typography>
              {p.published_version ? (
                <Chip label={`v${p.published_version}`} variant="success" />
              ) : (
                <Chip label={p.version_count > 0 ? "Draft" : "No versions"} />
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {provider && <ProviderIcon provider={provider} size={14} />}
                <Typography fontSize={12} color="text.secondary" noWrap>
                  {p.published_model || "-"}
                </Typography>
              </Box>
              <Typography fontSize={12} color="text.secondary">
                {displayFormattedDate(p.updated_at)}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ id: p.id, name: p.name });
                }}
                sx={{ color: "text.secondary" }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* Create modal — single instance */}
      <StandardModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Create prompt"
        description="Set up a new prompt template with a name and slug."
        onSubmit={handleCreate}
        submitButtonText="Create"
        isSubmitting={isSubmitting}
      >
        <Stack spacing={6}>
          {formError && (
            <Typography color="error" fontSize={13}>{formError}</Typography>
          )}
          <Field label="Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Customer support agent" />
          <Field label="Slug" value={form.slug} onChange={(v) => setForm((p) => ({ ...p, slug: v }))} placeholder="e.g. customer-support" />
          <Field label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Optional description" />
        </Stack>
      </StandardModal>

      {/* Delete modal */}
      <StandardModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete prompt"
        description="This action cannot be undone."
        onSubmit={handleDelete}
        submitButtonText="Delete"
        submitButtonColor="#c62828"
      >
        <Typography fontSize={13}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          All versions will be removed and any endpoints using this prompt will be unlinked.
        </Typography>
      </StandardModal>
    </Box>
  );
}
