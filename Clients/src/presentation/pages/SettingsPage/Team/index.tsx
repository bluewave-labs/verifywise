import React, {
  useState,
  useCallback,
  useMemo,
  useContext,
  lazy,
  Suspense,  
} from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  Stack,
  useTheme,
  SelectChangeEvent,
  TablePagination,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import TablePaginationActions from "../../../components/TablePagination";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import InviteUserModal from "../../../components/Modals/InviteUser";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { handleAlert } from "../../../../application/tools/alertUtils";
import VWButton from "../../../vw-v2-components/Buttons";
import singleTheme from "../../../themes/v1SingleTheme";
import { useRoles } from "../../../../application/hooks/useRoles";
import { deleteEntityById } from "../../../../application/repository/entity.repository";
import {
  getAllEntities,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
const Alert = lazy(() => import("../../../components/Alert"));

// Type definition for team member
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;  // Keep as string since it comes from API
};

// Constants for roles

const TABLE_COLUMNS = [
  { id: 'name', label: 'NAME' },
  { id: 'email', label: 'EMAIL' },
  { id: 'role', label: 'ROLE' },
  { id: 'action', label: 'ACTION' },
];

/**
 * A component that renders a team management table with the ability to edit member roles, invite new members, and delete members.
 *
 * @component
 * @returns {JSX.Element} The rendered team management table.
 */
const TeamManagement: React.FC = (): JSX.Element => {
  const theme = useTheme();
  const { roles, loading: rolesLoading } = useRoles();

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const roleItems = useMemo(
    () => roles.map(role => ({ _id: role.id, name: role.name })),
    [roles]
  );

  // State management
  const [open, setOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState(0);

  const [page, setPage] = useState(0); // Current page
  const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [teamUsers, setTeamUsers] = useState<TeamMember[]>(
    dashboardValues.users
  );
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);

    // Add debug log for team users
  // useEffect(() => {
  //   console.log('Team Users:', teamUsers);
  //   console.log('Dashboard Values:', dashboardValues);
  // }, [teamUsers, dashboardValues]);

  // Handle saving organization name
  // const handleSaveOrgName = useCallback(() => {
  //   console.log("Saving organization name:", orgName);
  // }, [orgName]);

  const fetchUsers = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/users" });
      if (!response?.data) return;
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        users: response.data,
      }));
      setTeamUsers(response?.data)
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await updateEntityById({
        routeUrl: `/users/${memberId}`,
        body: { role: newRole },
      });

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "User's role updated successfully",
        });
        setTimeout(() => setAlert(null), 3000);
        await fetchUsers();
      } else {
        setAlert({
          variant: "error",
          body: response.data?.data?.message || "An error occurred.",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error("API Error:", error);
      setAlert({
        variant: "error",
        body: `An error occurred: ${
          (error as Error).message || "Please try again."
        }`,
      });

      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMemberToDelete(null);
  };

  const confirmDelete = async () => {
    const response = await deleteEntityById({
      routeUrl: `/users/${memberToDelete}`,
    });
    if(response.status === 202) {
      handleAlert({
        variant: "success",
        body: "User deleted successfully",
        setAlert,
      });
      if (memberToDelete) {
        setTeamUsers((members) =>
          members.filter((member) => member.id !== memberToDelete)
        );
      }
    } else {
      handleAlert({
        variant: "error",
        body: "User deletion failed",
        setAlert,
      });
    }
    handleClose();
  };

  // Handle role change
  const handleRoleChange = useCallback(
    (event: SelectChangeEvent<string>, memberId: string) => {
      const newRole = event.target.value;
      handleUpdateRole(memberId, newRole);
    },
    []
  );

  // Typography component for role display
  const RoleTypography = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => (
      <Typography
        sx={{
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          color: '#344054'
        }}
      >
        {children}
      </Typography>
    );
  }, []);

  // Role value renderer
  const renderRoleValue = useCallback((value: string) => {
    const roleId = value?.toString() || '1';
    const selectedRole = roles.find(r => r.id.toString() === roleId);
    return <RoleTypography>{selectedRole?.name || 'Admin'}</RoleTypography>;
  }, [roles, RoleTypography]);

  // Filtered team members based on selected role
  const filteredMembers = useMemo(() => {
    return filter === 0
      ? teamUsers
      : teamUsers.filter((member) => parseInt(member.role) === filter);
  }, [filter, teamUsers]);

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setOpen(true);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // const paginatedMembers = useMemo(() => {
  //   const startIndex = page * rowsPerPage;
  //   return filteredMembers.slice(startIndex, startIndex + rowsPerPage);
  // }, [filteredMembers, page, rowsPerPage]);

  const inviteTeamMember = () => {
    console.log("Inviting team member");
    setInviteUserModalOpen(true);
  };

  const handleInvitation = (email: string, status: number | string) => {
    console.log("Invitation to ", email, "is ", status);
    handleAlert({
      variant: status === 200 ? "success" : "error",
      body: status === 200 ? "Invitation is sent" : "Invitation failed",
      setAlert,
    });

    setInviteUserModalOpen(false);
  };

  return (
    <Stack sx={{ mt: 3, }}>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
        </Suspense>
      )}

      <Box sx={{ mb: 4, maxWidth: theme.spacing(480) }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            flexGrow: 1,
            top: theme.spacing(2.5),
            fontSize: "13px",
            fontWeight: 600,
            color: "#1A1919",
            pt: theme.spacing(20),
          }}
        >
          Team members
        </Typography>
        <Stack sx={{ maxWidth: theme.spacing(480) }}>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", mb: 2, mt: 2 }}>
              {rolesLoading ? (
                <Typography>Loading roles...</Typography>
              ) : (
                [{ _id: 0, name: "All" }, ...roleItems].map((role) => (
                  <Button
                    key={role._id}
                    disableRipple
                    variant={filter === role._id ? "contained" : "outlined"}
                    onClick={() => setFilter(role._id | 0)}
                    sx={{
                      borderRadius: 0,
                      color: "#344054",
                      borderColor: "#EAECF0",
                      backgroundColor:
                        filter === role._id ? "#EAECF0" : "transparent",
                      "&:hover": {
                        backgroundColor:
                          filter === role._id ? "#D0D4DA" : "transparent",
                      },
                      fontWeight: filter === role._id ? "medium" : "normal",
                    }}
                  >
                    {role.name}
                  </Button>
                ))
              )}
            </Box>

            <Box>
              <VWButton
                variant="contained"
                text="Invite team member"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<GroupsIcon />}
                onClick={() => inviteTeamMember()}
              />
            </Box>
          </Stack>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
              <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                <TableRow>
                  {TABLE_COLUMNS.map((column) => (
                    <TableCell
                      key={column.id}
                      sx={{
                        ...singleTheme.tableStyles.primary.header.cell,
                        ...(column.id === 'action' && {
                          position: 'sticky',
                          right: 0,
                          backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
                        }),
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((member) => (
                      <TableRow key={member.id} sx={singleTheme.tableStyles.primary.body.row}>
                        <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                          {member.name}
                        </TableCell>
                        <TableCell sx={{...singleTheme.tableStyles.primary.body.cell, textTransform: 'none'}}>
                          {member.email}
                        </TableCell>
                        <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                          <Select
                            value={member.role || '1'}
                            onChange={(e) => handleRoleChange(e, member.id)}
                            size="small"
                            displayEmpty
                            renderValue={renderRoleValue}
                            sx={{
                              minWidth: "120px",
                              fontSize: '13px',
                              fontFamily: 'Inter, sans-serif',
                              color: '#344054',
                              "& .MuiOutlinedInput-notchedOutline": {
                                border: "none",
                              },
                              "& .MuiSelect-select": {
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                padding: '4px 8px',
                              }
                            }}
                          >
                            {roles.map((role) => (
                              <MenuItem 
                                key={role.id} 
                                value={role.id.toString()}
                                sx={{
                                  fontSize: '13px',
                                  fontFamily: 'Inter, sans-serif',
                                }}
                              >
                                {role.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            position: "sticky",
                            right: 0,
                            minWidth: "50px",
                          }}
                        >
                          <IconButton
                            onClick={() => handleDeleteClick(member.id)}
                            disableRipple
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow sx={singleTheme.tableStyles.primary.body.row}>
                    {TABLE_COLUMNS.map((column) => (
                      <TableCell key={column.id} sx={singleTheme.tableStyles.primary.body.cell}>
                        -
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {open && (
            <DualButtonModal
              title="Confirm Delete"
              body={
                <Typography fontSize={13}>
                  Are you sure you want to delete your account? This action is
                  permanent and cannot be undone.
                </Typography>
              }
              cancelText="Cancel"
              proceedText="Delete"
              onCancel={handleClose}
              onProceed={confirmDelete}
              proceedButtonColor="error"
              proceedButtonVariant="contained"
            />
          )}

          <TablePagination
            count={dashboardValues.vendors ? dashboardValues.vendors.length : 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={(props) => <TablePaginationActions {...props} />}
            labelRowsPerPage="Rows per page"
            labelDisplayedRows={({ page, count }) =>
              `Page ${page + 1} of ${Math.max(
                0,
                Math.ceil(count / rowsPerPage)
              )}`
            }
            slotProps={{
              select: {
                MenuProps: {
                  keepMounted: true,
                  PaperProps: {
                    className: "pagination-dropdown",
                    sx: {
                      mt: 0,
                      mb: theme.spacing(2),
                    },
                  },
                  transformOrigin: { vertical: "bottom", horizontal: "left" },
                  anchorOrigin: { vertical: "top", horizontal: "left" },
                  sx: { mt: theme.spacing(-2) },
                },
                inputProps: { id: "pagination-dropdown" },
                IconComponent: SelectorVertical,
                sx: {
                  ml: theme.spacing(4),
                  mr: theme.spacing(12),
                  minWidth: theme.spacing(20),
                  textAlign: "left",
                  "&.Mui-focused > div": {
                    backgroundColor: theme.palette.background.main,
                  },
                },
              },
            }}
            sx={{
              mt: theme.spacing(6),
              color: theme.palette.text.secondary,
              "& .MuiSelect-icon": {
                width: "24px",
                height: "fit-content",
              },
              "& .MuiSelect-select": {
                width: theme.spacing(10),
                border: `1px solid ${theme.palette.border.light}`,
                padding: theme.spacing(4),
              },
            }}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 20 }}
          ></Box>
        </Stack>
      </Box>
      {inviteUserModalOpen && (
        <InviteUserModal
          isOpen={inviteUserModalOpen}
          setIsOpen={setInviteUserModalOpen}
          onSendInvite={handleInvitation}
        />
      )}
    </Stack>
  );
};

export default TeamManagement;