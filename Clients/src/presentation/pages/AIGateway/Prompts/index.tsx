import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { CirclePlus, Trash2, BookOpen, FileText, Link } from "lucide-react";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Chip from "../../../components/Chip";
import Field from "../../../components/Inputs/Field";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import TablePaginationActions from "../../../components/TablePagination";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { displayFormattedDate } from "../../../tools/isoDateToString";
import { getPaginationRowCount, setPaginationRowCount } from "../../../../application/utils/paginationStorage";
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

const CELL_SX = { fontSize: 13, py: 1.5, borderColor: "border.light" } as const;
const HEAD_SX = { ...CELL_SX, fontWeight: 600, fontSize: 12, color: "text.secondary" } as const;

export default function PromptsPage() {
  const cardSx = useCardSx();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => getPaginationRowCount("aiGatewayPrompts", 10));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const loadData = useCallback(async () => {
    try {
      const res = await apiServices.get("/ai-gateway/prompts");
      setPrompts(res?.data?.data || []);
    } catch { /* silently handle */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, name: value, slug: slugify(value) }));
  };

  const closeCreateModal = () => { setIsCreateOpen(false); setFormError(""); };

  const handleCreate = async () => {
    if (!form.name || !form.slug) { setFormError("Name is required"); return; }
    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await apiServices.post("/ai-gateway/prompts", {
        name: form.name, slug: form.slug, description: form.description || null,
      });
      const created = res?.data?.data;
      setIsCreateOpen(false);
      setForm({ name: "", slug: "", description: "" });
      if (created?.id) navigate(`/ai-gateway/prompts/${created.id}`);
      else loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.data || err?.response?.data?.message || "Failed to create prompt");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiServices.delete(`/ai-gateway/prompts/${deleteTarget.id}`);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* silently handle */ }
  };

  const actionButton = (
    <CustomizableButton
      text="Create prompt"
      icon={<CirclePlus size={14} strokeWidth={1.5} />}
      onClick={() => setIsCreateOpen(true)}
      sx={{ height: 34 }}
    />
  );

  const createModal = (
    <StandardModal
      isOpen={isCreateOpen}
      onClose={closeCreateModal}
      title="Create prompt"
      description="Set up a new prompt template."
      onSubmit={handleCreate}
      submitButtonText="Create"
      isSubmitting={isSubmitting}
      maxWidth="480px"
    >
      <Stack spacing={6}>
        {formError && <Typography color="error" fontSize={13}>{formError}</Typography>}
        <Field label="Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Customer support agent" />
        <Field label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
      </Stack>
    </StandardModal>
  );

  const deleteModal = (
    <StandardModal
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      title="Delete prompt"
      description={`Are you sure you want to delete "${deleteTarget?.name || ""}"?`}
      onSubmit={handleDelete}
      submitButtonText="Delete"
      submitButtonColor="#c62828"
      maxWidth="480px"
    >
      <Typography fontSize={13}>
        All versions will be removed and any endpoints using this prompt will be unlinked.
        This action cannot be undone.
      </Typography>
    </StandardModal>
  );

  if (loading) return null;

  if (prompts.length === 0 && !isCreateOpen) {
    return (
      <PageHeaderExtended title="Prompts" tipBoxEntity="ai-gateway-prompts" actionButton={actionButton}>
        <EmptyState
          icon={BookOpen}
          message="No prompts yet. Create your first prompt template to centralize and version-control system instructions."
        >
          <EmptyStateTip icon={FileText} title="Prompts are reusable message templates" description="Define system and user messages with {{variables}} that get resolved at request time. Each prompt tracks versions so you can test, compare, and roll back." />
          <EmptyStateTip icon={Link} title="Bind prompts to endpoints" description="Once published, a prompt can be bound to any endpoint. Every request through that endpoint automatically uses the prompt's messages as a base." />
        </EmptyState>
        {createModal}
      </PageHeaderExtended>
    );
  }

  const paginatedPrompts = prompts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageHeaderExtended title="Prompts" tipBoxEntity="ai-gateway-prompts" actionButton={actionButton}>
      <TableContainer sx={{ ...cardSx, p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={HEAD_SX}>Name</TableCell>
              <TableCell sx={HEAD_SX}>Version</TableCell>
              <TableCell sx={HEAD_SX}>Model</TableCell>
              <TableCell sx={HEAD_SX}>Updated</TableCell>
              <TableCell sx={{ ...HEAD_SX, width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrompts.map((p) => {
              const provider = p.published_model?.includes("/") ? p.published_model.split("/")[0] : "";
              return (
                <TableRow
                  key={p.id}
                  hover
                  onClick={() => navigate(`/ai-gateway/prompts/${p.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={CELL_SX}>
                    <Typography fontSize={13} fontWeight={500}>{p.name}</Typography>
                    {p.description && (
                      <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }} noWrap>{p.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={CELL_SX}>
                    {p.published_version
                      ? <Chip label={`v${p.published_version}`} variant="success" />
                      : <Chip label={p.version_count > 0 ? "Draft" : "No versions"} />}
                  </TableCell>
                  <TableCell sx={CELL_SX}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {provider && <ProviderIcon provider={provider} size={14} />}
                      <Typography fontSize={12} color="text.secondary" noWrap>{p.published_model || "-"}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...CELL_SX, color: "text.secondary", fontSize: 12 }}>{displayFormattedDate(p.updated_at)}</TableCell>
                  <TableCell sx={{ ...CELL_SX, width: 48 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name }); }}
                      sx={{ color: "text.secondary" }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {prompts.length > 5 && (
          <TablePagination
            component="div"
            count={prompts.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setRowsPerPage(val);
              setPaginationRowCount("aiGatewayPrompts", val);
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            ActionsComponent={TablePaginationActions}
            sx={{ borderTop: "1px solid", borderColor: "border.light" }}
          />
        )}
      </TableContainer>

      {createModal}
      {deleteModal}
    </PageHeaderExtended>
  );
}
