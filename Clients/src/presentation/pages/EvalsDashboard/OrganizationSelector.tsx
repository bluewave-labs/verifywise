import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Autocomplete,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { deepEvalOrgsService, type OrgMember } from "../../../infrastructure/api/deepEvalOrgsService";
import { getAllUsers } from "../../../application/repository/user.repository";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import { Beaker, CirclePlus, Trash2 } from "lucide-react";
import ConfirmableDeleteIconButton from "../../components/Modals/ConfirmableDeleteIconButton";
import Alert from "../../components/Alert";

interface Props {
  onSelected: () => void;
}

interface Organization {
  id: string;
  name: string;
  created_at?: string;
  createdAt?: string;
  projects_count?: number;
  members?: OrgMember[];
  member_ids?: number[];
}

interface UserOption {
  id: number;
  name: string;
  surname: string;
  email: string;
}

interface NewOrgState {
  name: string;
  selectedUsers: UserOption[];
}

export default function OrganizationSelector({ onSelected }: Props) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState<NewOrgState>({ name: "", selectedUsers: [] });
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editSelectedUsers, setEditSelectedUsers] = useState<UserOption[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrgs();
    loadUsers();
  }, []);

  const loadOrgs = async () => {
    try {
      const { orgs } = await deepEvalOrgsService.getAllOrgs();
      setOrgs(orgs);
    } catch (err) {
      console.error("Failed to load organizations:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      const userData = response.data || [];
      setUsers(userData.map((u: UserOption) => ({
        id: u.id,
        name: u.name,
        surname: u.surname,
        email: u.email,
      })));
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handlePick = async (orgId: string) => {
    await deepEvalOrgsService.setCurrentOrg(orgId);
    onSelected();
  };

  const handleDeleteOrg = async (orgId: string) => {
    try {
      setDeletingId(orgId);
      await deepEvalOrgsService.deleteOrg(orgId);
      setOrgs((prev) => prev.filter((o) => o.id !== orgId));
      setAlert({ variant: "success", body: "Organization deleted" });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    if (org.members && org.members.length > 0) {
      const mapped = org.members.map((m: OrgMember) => ({
        id: m.id,
        name: m.name,
        surname: m.surname,
        email: m.email,
      }));
      setEditSelectedUsers(mapped);
    } else if (org.member_ids && org.member_ids.length > 0) {
      const mapped = users.filter((u) => org.member_ids?.includes(u.id));
      setEditSelectedUsers(mapped);
    } else {
      setEditSelectedUsers([]);
    }
    setEditOpen(true);
  };

  const handleUpdateOrg = async () => {
    if (!editingOrg || !editName.trim()) return;
    try {
      setUpdating(true);
      const memberIds = editSelectedUsers.map((u) => u.id);
      const { org } = await deepEvalOrgsService.updateOrg(editingOrg.id, editName.trim(), memberIds);
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? { ...o, ...org } : o)));
      setAlert({ variant: "success", body: "Organization updated" });
      setTimeout(() => setAlert(null), 4000);
      setEditOpen(false);
      setEditingOrg(null);
      setEditName("");
      setEditSelectedUsers([]);
    } catch (err) {
      console.error("Failed to update organization:", err);
      setAlert({ variant: "error", body: "Failed to update organization" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Description + header */}
      <Stack spacing={2} mb={4}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Organize your evaluations under an organization. Select an existing organization or create a new one to get started.
        </Typography>
        <Divider sx={{ mt: 3 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, pb: 2 }}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Organizations
          </Typography>
          <CustomizableButton
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<CirclePlus size={18} />}
            sx={{ textTransform: "none", backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0f5a47" } }}
          >
            Create organization
          </CustomizableButton>
        </Stack>
      </Stack>

      {orgs.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 12,
            px: 3,
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            minHeight: 360,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Beaker size={64} color="#9CA3AF" strokeWidth={1.5} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "18px", color: "#111827" }}>
            No organizations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: "14px", maxWidth: 480, lineHeight: 1.6, color: "#6B7280" }}>
            Create your first organization to start managing projects and experiments.
          </Typography>
          <CustomizableButton
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<CirclePlus size={18} />}
            sx={{ textTransform: "none", backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0f5a47" } }}
          >
            Create your first organization
          </CustomizableButton>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orgs.map((o) => (
            <Grid item xs={12} sm={6} md={4} key={o.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #E5E7EB",
                  boxShadow: "none",
                  userSelect: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-2px)",
                    borderColor: "#13715B",
                  },
                }}
                onClick={() => handlePick(o.id)}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {o.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: "13px", color: "#6B7280" }}>
                    Click to enter
                  </Typography>
                </CardContent>
                <CardActions
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    pt: 0,
                    gap: 1,
                    borderTop: "1px solid #F3F4F6",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "11px" }}
                  >
                    ID: {o.id}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CustomizableButton
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePick(o.id);
                      }}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        backgroundColor: "#13715B",
                        "&:hover": { backgroundColor: "#0f5a47" },
                      }}
                    >
                      Open
                    </CustomizableButton>
                    <CustomizableButton
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(o);
                      }}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                      }}
                    >
                      Edit
                    </CustomizableButton>
                    <ConfirmableDeleteIconButton
                      id={o.id}
                      disabled={deletingId === o.id}
                      onConfirm={(id) => handleDeleteOrg(String(id))}
                      title="Delete organization?"
                      message="This will remove the organization. Existing projects will remain but will no longer be associated with this organization."
                      customIcon={<Trash2 size={16} color="#b91c1c" />}
                    />
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Organization Modal */}
      <StandardModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewOrg({ name: "", selectedUsers: [] });
        }}
        title="Create organization"
        description="Name your organization and select members to begin organizing projects and experiments."
        onSubmit={async () => {
          if (!newOrg.name.trim()) return;
          setCreating(true);
          try {
            const memberIds = newOrg.selectedUsers.map(u => u.id);
            const { org } = await deepEvalOrgsService.createOrg(newOrg.name.trim(), memberIds);
            // Persist as current org and close modal
            await deepEvalOrgsService.setCurrentOrg(org.id);
            setCreateOpen(false);
            setNewOrg({ name: "", selectedUsers: [] });
            onSelected();
          } finally {
            setCreating(false);
          }
        }}
        submitButtonText="Create organization"
        isSubmitting={creating || !newOrg.name.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Organization name"
            value={newOrg.name}
            onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
            placeholder="e.g., VerifyEvals"
            isRequired
          />
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, mb: 1, color: "#344054" }}>
              Members
            </Typography>
            <Autocomplete
              multiple
              options={users}
              value={newOrg.selectedUsers}
              onChange={(_, newValue) => setNewOrg({ ...newOrg, selectedUsers: newValue })}
              getOptionLabel={(option) => `${option.name} ${option.surname}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select members..."
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: "13px",
                      borderRadius: "4px",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      {option.name} {option.surname}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} ${option.surname}`}
                    size="small"
                    sx={{ fontSize: "12px" }}
                  />
                ))
              }
            />
          </Box>
        </Stack>
      </StandardModal>

      {/* Edit Organization Modal */}
      <StandardModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingOrg(null);
          setEditName("");
          setEditSelectedUsers([]);
        }}
        title="Edit organization"
        description="Update the organization name and members."
        onSubmit={handleUpdateOrg}
        submitButtonText="Save changes"
        isSubmitting={updating || !editName.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Organization name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g., VerifyEvals"
            isRequired
          />
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, mb: 1, color: "#344054" }}>
              Members
            </Typography>
            <Autocomplete
              multiple
              options={users}
              value={editSelectedUsers}
              onChange={(_, newValue) => setEditSelectedUsers(newValue)}
              getOptionLabel={(option) => `${option.name} ${option.surname}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select members..."
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: "13px",
                      borderRadius: "4px",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      {option.name} {option.surname}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} ${option.surname}`}
                    size="small"
                    sx={{ fontSize: "12px" }}
                  />
                ))
              }
            />
          </Box>
        </Stack>
      </StandardModal>
    </Box>
  );
}
