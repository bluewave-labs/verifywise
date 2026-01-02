import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Eye,
  Copy,
  ClipboardList,
} from "lucide-react";
import {
  getAllIntakeForms,
  deleteIntakeForm,
  archiveIntakeForm,
  IntakeForm,
  IntakeFormStatus,
  IntakeEntityType,
} from "../../../application/repository/intakeForm.repository";

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Status chip colors
 */
const STATUS_COLORS: Record<IntakeFormStatus, { bg: string; color: string }> = {
  [IntakeFormStatus.DRAFT]: { bg: "#fef3c7", color: "#d97706" },
  [IntakeFormStatus.ACTIVE]: { bg: "#dcfce7", color: "#16a34a" },
  [IntakeFormStatus.ARCHIVED]: { bg: "#f3f4f6", color: "#6b7280" },
};

/**
 * Entity type labels
 */
const ENTITY_LABELS: Record<IntakeEntityType, string> = {
  [IntakeEntityType.MODEL]: "Model inventory",
  [IntakeEntityType.USE_CASE]: "Use case",
};

/**
 * Intake forms list page component
 */
export function IntakeFormsListPage() {
  const navigate = useNavigate();

  // State
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IntakeFormStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load forms
  const loadForms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { status?: IntakeFormStatus } = {};
      if (activeTab !== "all") {
        params.status = activeTab;
      }
      const response = await getAllIntakeForms(params);
      setForms(response.data.forms || []);
    } catch (error) {
      console.error("Failed to load forms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Filter forms by search query
  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, form: IntakeForm) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Actions
  const handleEdit = () => {
    if (selectedForm) {
      navigate(`/intake-forms/${selectedForm.id}/edit`);
    }
    handleMenuClose();
  };

  const handlePreview = () => {
    if (selectedForm) {
      window.open(`/intake/preview/${selectedForm.slug}`, "_blank");
    }
    handleMenuClose();
  };

  const handleCopyLink = () => {
    if (selectedForm) {
      const link = `${window.location.origin}/intake/${selectedForm.slug}`;
      navigator.clipboard.writeText(link);
    }
    handleMenuClose();
  };

  const handleArchive = async () => {
    if (selectedForm) {
      try {
        await archiveIntakeForm(selectedForm.id);
        loadForms();
      } catch (error) {
        console.error("Failed to archive form:", error);
      }
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedForm) {
      setIsDeleting(true);
      try {
        await deleteIntakeForm(selectedForm.id);
        loadForms();
      } catch (error) {
        console.error("Failed to delete form:", error);
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setSelectedForm(null);
      }
    }
  };

  const handleRowClick = (form: IntakeForm) => {
    navigate(`/intake-forms/${form.id}/edit`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "#1f2937", fontSize: "20px" }}
          >
            Intake forms
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", fontSize: "13px", mt: 0.5 }}
          >
            Create and manage intake forms for external submissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => navigate("/intake-forms/new")}
          sx={{
            height: 34,
            backgroundColor: "#13715B",
            textTransform: "none",
            fontSize: "13px",
            "&:hover": { backgroundColor: "#0f5c49" },
          }}
        >
          Create form
        </Button>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "13px",
              minWidth: "auto",
              px: 2,
            },
            "& .Mui-selected": { color: "#13715B" },
            "& .MuiTabs-indicator": { backgroundColor: "#13715B" },
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Active" value={IntakeFormStatus.ACTIVE} />
          <Tab label="Draft" value={IntakeFormStatus.DRAFT} />
          <Tab label="Archived" value={IntakeFormStatus.ARCHIVED} />
        </Tabs>
        <TextField
          placeholder="Search forms..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 250,
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              "& fieldset": { borderColor: "#d0d5dd" },
            },
          }}
        />
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#13715B" }} />
        </Box>
      ) : filteredForms.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid #d0d5dd",
            borderRadius: "8px",
          }}
        >
          <ClipboardList size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1f2937", mb: 1, fontSize: "16px" }}
          >
            No forms found
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", mb: 3, fontSize: "13px" }}
          >
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first intake form to get started"}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => navigate("/intake-forms/new")}
              sx={{
                height: 34,
                backgroundColor: "#13715B",
                textTransform: "none",
                fontSize: "13px",
                "&:hover": { backgroundColor: "#0f5c49" },
              }}
            >
              Create form
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "8px" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Form name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Entity type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Fields
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                  Updated
                </TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow
                  key={form.id}
                  onClick={() => handleRowClick(form)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f9fafb" },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography
                        sx={{ fontWeight: 500, fontSize: "13px", color: "#1f2937" }}
                      >
                        {form.name}
                      </Typography>
                      {form.description && (
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#6b7280",
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {form.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", color: "#1f2937" }}>
                      {ENTITY_LABELS[form.entityType]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={form.status}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "11px",
                        textTransform: "capitalize",
                        backgroundColor: STATUS_COLORS[form.status].bg,
                        color: STATUS_COLORS[form.status].color,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", color: "#1f2937" }}>
                      {form.schema?.fields?.length || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                      {formatDate(form.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                      {formatDate(form.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, form)}
                      sx={{ p: 0.5 }}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 160,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit size={18} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
            Edit
          </ListItemText>
        </MenuItem>
        {selectedForm?.status === IntakeFormStatus.ACTIVE && (
          <>
            <MenuItem onClick={handlePreview}>
              <ListItemIcon>
                <Eye size={18} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
                Preview
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCopyLink}>
              <ListItemIcon>
                <Copy size={18} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
                Copy link
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleArchive}>
              <ListItemIcon>
                <Archive size={18} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
                Archive
              </ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleDeleteClick} sx={{ color: "#ef4444" }}>
          <ListItemIcon>
            <Trash2 size={18} color="#ef4444" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "8px", maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontSize: "16px", fontWeight: 600 }}>
          Delete form
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "13px" }}>
            Are you sure you want to delete "{selectedForm?.name}"? This action cannot
            be undone and all submissions will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            sx={{
              textTransform: "none",
              fontSize: "13px",
              backgroundColor: "#ef4444",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IntakeFormsListPage;
