import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  SelectChangeEvent,
} from "@mui/material";
import { deepEvalOrgsService, type OrgMember } from "../../../infrastructure/api/deepEvalOrgsService";
import { getAllUsers } from "../../../application/repository/user.repository";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import IconButtonComponent from "../../components/IconButton";
import singleTheme from "../../themes/v1SingleTheme";
import { Beaker } from "lucide-react";
import Alert from "../../components/Alert";
import CustomizableMultiSelect from "../../components/Inputs/Select/Multi";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";

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

const tableColumns = [
  { id: "name", label: "Organization name" },
  { id: "members", label: "Members" },
  { id: "projects", label: "Projects" },
  { id: "created", label: "Created" },
  { id: "actions", label: "Actions" },
];

export default function OrganizationSelector({ onSelected }: Props) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState("");
  const [editSelectedUserIds, setEditSelectedUserIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [orgToSwitch, setOrgToSwitch] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrgs();
    loadUsers();
  }, []);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const { orgs } = await deepEvalOrgsService.getAllOrgs();
      // Load users first to resolve member_ids
      const usersResponse = await getAllUsers();
      const allUsers = usersResponse.data || [];
      const userMap = new Map<number, UserOption>(
        allUsers.map((u: UserOption) => [u.id, u])
      );
      // Fetch actual project counts and resolve members for each org
      const orgsWithData = await Promise.all(
        orgs.map(async (org) => {
          // Resolve member_ids to actual user objects
          const memberIds = org.member_ids || [];
          const members: OrgMember[] = memberIds
            .map((id: number) => userMap.get(id))
            .filter((u): u is UserOption => !!u)
            .map((u) => ({
              id: u.id,
              name: u.name,
              surname: u.surname,
              email: u.email,
            }));
          try {
            const projectIds = await deepEvalOrgsService.getProjectsForOrg(org.id);
            return { ...org, projects_count: projectIds.length, members };
          } catch {
            return { ...org, projects_count: org.projects_count ?? 0, members };
          }
        })
      );
      setOrgs(orgsWithData);
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
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

  const handlePick = (org: Organization) => {
    setOrgToSwitch(org);
    setSwitchModalOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!orgToSwitch) return;
    await deepEvalOrgsService.setCurrentOrg(orgToSwitch.id);
    setSwitchModalOpen(false);
    setOrgToSwitch(null);
    onSelected();
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    // Set the selected user IDs based on existing members
    const existingMembers = org.members || [];
    setEditSelectedUserIds(existingMembers.map(m => m.id));
    setEditOpen(true);
  };

  const handleDelete = async (orgId: string) => {
    try {
      await deepEvalOrgsService.deleteOrg(orgId);
      setAlert({ variant: "success", body: "Organization deleted successfully" });
      setTimeout(() => setAlert(null), 4000);
      await loadOrgs();
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete organization" });
      setTimeout(() => setAlert(null), 6000);
    }
  };

  const handleUpdateOrg = async () => {
    if (!editingOrg || !editName.trim()) return;
    setUpdating(true);
    try {
      await deepEvalOrgsService.updateOrg(editingOrg.id, editName.trim(), editSelectedUserIds);
      setAlert({ variant: "success", body: "Organization updated successfully" });
      setTimeout(() => setAlert(null), 4000);
      setEditOpen(false);
      setEditingOrg(null);
      setEditName("");
      setEditSelectedUserIds([]);
      await loadOrgs();
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to update organization" });
      setTimeout(() => setAlert(null), 6000);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (org: Organization) => {
    const dateStr = org.created_at || org.createdAt;
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getMemberDisplay = (org: Organization) => {
    const members = org.members || [];
    if (members.length === 0) return "-";
    if (members.length === 1) return `${members[0].name} ${members[0].surname}`;
    if (members.length === 2) return `${members[0].name}, ${members[1].name}`;
    return `${members[0].name}, ${members[1].name} +${members.length - 2}`;
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
          Organization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Your organization manages all projects and evaluations. You can edit the organization name below.
        </Typography>
      </Stack>

      {!loading && orgs.length === 0 ? (
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
            Setting up your organization...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: "14px", maxWidth: 480, lineHeight: 1.6, color: "#6B7280" }}>
            A default organization is being created. Please wait a moment and refresh the page.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ textTransform: "none" }}
          >
            Refresh page
          </Button>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead
              sx={{
                backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
              }}
            >
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {tableColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{
                      ...singleTheme.tableStyles.primary.header.cell,
                      ...(column.id === "actions" ? { width: "140px" } : {}),
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {orgs.map((org) => (
                <TableRow
                  key={org.id}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  onClick={() => handleEdit(org)}
                >
                  {/* Organization name */}
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "13px" }}>
                      {org.name}
                    </Typography>
                  </TableCell>

                  {/* Members */}
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: "13px", color: "#6B7280" }}>
                        {getMemberDisplay(org)}
                      </Typography>
                      {(org.members?.length || 0) > 0 && (
                        <Chip
                          label={org.members?.length}
                          size="small"
                          sx={{ height: 18, fontSize: "11px", backgroundColor: "#E5E7EB" }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* Projects count */}
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Typography variant="body2" sx={{ fontSize: "13px", color: "#6B7280" }}>
                      {org.projects_count ?? 0}
                    </Typography>
                  </TableCell>

                  {/* Created date */}
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Typography variant="body2" sx={{ fontSize: "13px", color: "#6B7280" }}>
                      {formatDate(org)}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell
                    sx={singleTheme.tableStyles.primary.body.cell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePick(org)}
                        sx={{
                          fontSize: "12px",
                          textTransform: "none",
                          borderColor: "#13715B",
                          color: "#13715B",
                          height: "28px",
                          px: 1.5,
                          "&:hover": {
                            borderColor: "#0f5a47",
                            backgroundColor: "rgba(19, 113, 91, 0.04)",
                          },
                        }}
                      >
                        Select
                      </Button>
                      <IconButtonComponent
                        id={org.id}
                        onDelete={() => handleDelete(org.id)}
                        onEdit={() => handleEdit(org)}
                        onMouseEvent={() => {}}
                        warningTitle="Delete this organization?"
                        warningMessage="When you delete this organization, all associated projects and experiments will be permanently removed. This action cannot be undone."
                        type="organization"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Organization Modal */}
      <StandardModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingOrg(null);
          setEditName("");
          setEditSelectedUserIds([]);
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
          <CustomizableMultiSelect
            label="Members"
            items={users.map(u => ({ _id: u.id, name: u.name, surname: u.surname, email: u.email }))}
            value={editSelectedUserIds}
            onChange={(event: SelectChangeEvent<string | number | (string | number)[]>) => {
              const selected = event.target.value as number[];
              setEditSelectedUserIds(selected);
            }}
            placeholder="Select members..."
          />
        </Stack>
      </StandardModal>

      {/* Switch Organization Confirmation Modal */}
      <DualButtonModal
        isOpen={switchModalOpen}
        title="Switch organization?"
        TitleFontSize={16}
        body={
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            You are about to switch to &quot;{orgToSwitch?.name || "this organization"}&quot;. You will see projects and experiments from this organization.
          </Typography>
        }
        cancelText="Cancel"
        proceedText="Switch"
        onCancel={() => {
          setSwitchModalOpen(false);
          setOrgToSwitch(null);
        }}
        onProceed={handleConfirmSwitch}
        proceedButtonColor="primary"
        proceedButtonVariant="contained"
      />
    </Box>
  );
}
