import React, { useState, useCallback, useMemo, useContext } from "react";
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
  Paper,
  Select,
  MenuItem,
  IconButton,
  Stack,
  useTheme,
  SelectChangeEvent,
  TablePagination,
} from "@mui/material";
import Trashbin from "../../../../presentation/assets/icons/trash-01.svg";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import TablePaginationActions from "../../../components/TablePagination";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import InviteUserModal from "../../../components/Modals/InviteUser";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

// Enum for roles
enum Role {
  Administrator = "Administrator",
  Editor = "Editor",
  Reviewer = "Reviewer",
}

// Type definition for team member
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Constants for roles
const roles = Object.values(Role);

/**
 * A component that renders a team management table with the ability to edit member roles, invite new members, and delete members.
 *
 * @component
 * @returns {JSX.Element} The rendered team management table.
 */
const TeamManagement: React.FC = (): JSX.Element => {
  const theme = useTheme();

  // State management
  // const [orgName, _] = useState("BlueWave Labs");
  const [open, setOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<Role | "All">("All");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Connor",
      email: "john@domain.com",
      role: Role.Administrator,
    },
    {
      id: "2",
      name: "Adam McFadden",
      email: "adam@domain.com",
      role: Role.Reviewer,
    },
    {
      id: "3",
      name: "Cris Cross",
      email: "cris@domain.com",
      role: Role.Editor,
    },
    { id: "4", name: "Prince", email: "prince@domain.com", role: Role.Editor },
  ]);

  const [page, setPage] = useState(0); // Current page
  const { dashboardValues } = useContext(VerifyWiseContext);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);

  // Handle saving organization name
  // const handleSaveOrgName = useCallback(() => {
  //   console.log("Saving organization name:", orgName);
  // }, [orgName]);

  const handleClose = () => {
    setOpen(false);
    setMemberToDelete(null);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      setTeamMembers((members) =>
        members.filter((member) => member.id !== memberToDelete)
      );
    }
    handleClose();
  };

  // Handle role change
  const handleRoleChange = useCallback(
    (event: SelectChangeEvent<Role>, memberId: string) => {
      const newRole = event.target.value as Role;
      setTeamMembers((members) =>
        members.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
    },
    []
  );

  // Handle deleting a team member
  // const handleDeleteMember = useCallback((memberId: string) => {
  //   setTeamMembers((members) =>
  //     members.filter((member) => member.id !== memberId)
  //   );
  // }, []);

  // Filtered team members based on selected role
  const filteredMembers = useMemo(() => {
    return filter === "All"
      ? teamMembers
      : teamMembers.filter((member) => member.role === filter);
  }, [filter, teamMembers]);

  // Handle saving all data
  // const handleSaveAllData = useCallback(() => {
  //   const formData = {
  //     organizationName: orgName,
  //     filterRole: filter,
  //     teamMembers: teamMembers.map(({ id, name, email, role }) => ({
  //       id,
  //       name,
  //       email,
  //       role,
  //     })),
  //   };
  //   console.log("Form Data:", formData);
  // }, [orgName, filter, teamMembers]);

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

  return (
    <Stack sx={{ pt: theme.spacing(10) }}>
      {/* <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            flexGrow: 1,
            top: theme.spacing(2.5),
            fontSize: "13px",
            fontWeight: 600,
            color: "#1A1919",
          }}
        >
          Organization name
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
            mt: theme.spacing(5),
          }}
        >
          <Field
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          <Button
            variant="contained"
            onClick={handleSaveOrgName}
            sx={{
              ml: theme.spacing(10),
              width: theme.spacing(35),
              height: theme.spacing(17),
            }}
            disableRipple
          >
            Save
          </Button>
        </Box>
      </Box> */}

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
            }}
          >
            <Box sx={{ display: "flex", mb: 12, mt: 10 }}>
              {["All", ...roles].map((role) => (
                <Button
                  key={role}
                  disableRipple
                  variant={filter === role ? "contained" : "outlined"}
                  onClick={() => setFilter(role as Role | "All")}
                  sx={{
                    borderRadius: 0,
                    color: "#344054",
                    borderColor: "#EAECF0",
                    backgroundColor:
                      filter === role ? "#EAECF0" : "transparent",
                    "&:hover": {
                      backgroundColor:
                        filter === role ? "#D0D4DA" : "transparent",
                    },
                    fontWeight: filter === role ? "bold" : "normal",
                  }}
                >
                  {role}
                </Button>
              ))}
            </Box>

            <Box sx={{ mt: 10 }}>
              <Button
                variant="contained"
                disableRipple
                onClick={() => inviteTeamMember()}
              >
                Invite team member
              </Button>
            </Box>
          </Stack>

          <TableContainer
            component={Paper}
            sx={{ maxWidth: theme.spacing(480) }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>NAME</TableCell>
                  <TableCell>EMAIL</TableCell>
                  <TableCell>ROLE</TableCell>
                  <TableCell>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onChange={(e) => handleRoleChange(e, member.id)}
                          size="small"
                          sx={{
                            minWidth: 120,
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none", // Remove the border from the notched outline
                            },
                          }}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role} value={role}>
                              {role}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleDeleteClick(member.id)}
                        >
                          <img
                            src={Trashbin}
                            alt="Delete"
                            width={20}
                            height={20}
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
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
            count={dashboardValues.vendors.length}
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

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 20 }}>
            {/* <Button
              variant="contained"
              disableRipple
              onClick={handleSaveAllData}
            >
              Save
            </Button> */}
          </Box>
        </Stack>
      </Box>
      {inviteUserModalOpen && (
        <InviteUserModal
          isOpen={inviteUserModalOpen}
          setIsOpen={setInviteUserModalOpen}
          onSendInvite={(data) => {
            console.log("Invite sent:", data);
            setInviteUserModalOpen(false);
          }}
        />
      )}
    </Stack>
  );
};

export default TeamManagement;
