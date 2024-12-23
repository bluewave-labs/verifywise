import React, { useState, useCallback, useMemo } from "react";
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
import Field from "../../../components/Inputs/Field";

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
  const [orgName, setOrgName] = useState("BlueWave Labs");
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
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page

  // Handle saving organization name
  const handleSaveOrgName = useCallback(() => {
    console.log("Saving organization name:", orgName);
  }, [orgName]);

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
  const handleDeleteMember = useCallback((memberId: string) => {
    setTeamMembers((members) =>
      members.filter((member) => member.id !== memberId)
    );
  }, []);

  // Filtered team members based on selected role
  const filteredMembers = useMemo(() => {
    return filter === "All"
      ? teamMembers
      : teamMembers.filter((member) => member.role === filter);
  }, [filter, teamMembers]);

  // Handle saving all data
  const handleSaveAllData = useCallback(() => {
    const formData = {
      organizationName: orgName,
      filterRole: filter,
      teamMembers: teamMembers.map(({ id, name, email, role }) => ({
        id,
        name,
        email,
        role,
      })),
    };
    console.log("Form Data:", formData);
  }, [orgName, filter, teamMembers]);

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

  return (
    <Stack sx={{ pt: theme.spacing(10) }}>
      <Box sx={{ mb: 4 }}>
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
      </Box>

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
              <Button variant="contained" disableRipple>
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
                  <TableCell sx={{ color: "#667085" }}>NAME</TableCell>
                  <TableCell sx={{ color: "#667085" }}>EMAIL</TableCell>
                  <TableCell sx={{ color: "#667085" }}>ROLE</TableCell>
                  <TableCell sx={{ color: "#667085" }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) // Apply pagination to filtered members
                  .map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onChange={(event) =>
                            handleRoleChange(event, member.id)
                          }
                          size="small"
                          sx={{
                            textAlign: "left",
                            paddingLeft: 0,
                            marginLeft: 0,
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                            color: "#667085",
                            fontSize: 13,
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
                          aria-label="delete"
                          onClick={() => handleDeleteMember(member.id)}
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

          <TablePagination
            component="div"
            count={filteredMembers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 20 }}>
            <Button
              variant="contained"
              disableRipple
              onClick={handleSaveAllData}
            >
              Save
            </Button>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
};

export default TeamManagement;
