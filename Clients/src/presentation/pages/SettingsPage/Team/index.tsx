/**
 * A component that renders a team management table with the ability to edit member roles, invite new members, and delete members.
 *
 * @component
 * @returns {JSX.Element} The rendered team management table.
 */

import { useState } from "react";
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
  SelectChangeEvent,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import Trashbin from "../../../../presentation/assets/icons/trash-01.svg"; // Imported as an SVG file
import Field from "../../../components/Inputs/Field";


type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Editor" | "Reviewer";
};

const roles = ["Administrator", "Editor", "Reviewer"] as const;

export default function index() {
  const [orgName, setOrgName] = useState("BlueWave Labs");
  const [filter, setFilter] = useState("All");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Connor",
      email: "john@domain.com",
      role: "Administrator",
    },
    {
      id: "2",
      name: "Adam McFadden",
      email: "adam@domain.com",
      role: "Reviewer",
    },
    { id: "3", name: "Cris Cross", email: "cris@domain.com", role: "Editor" },
    { id: "4", name: "Prince", email: "prince@domain.com", role: "Editor" },
  ]);

  const theme = useTheme();

  /**
   * Handles the saving of the organization name.
   * Logs the organization name to the console when the save button is clicked.
   */
  const handleSaveOrgName = () => {
    console.log("Saving organization name:", orgName);
  };

  /**
   * Handles changing the role of a team member.
   *
   * @param {SelectChangeEvent<string>} event - The event triggered by the selection change.
   * @param {string} memberId - The ID of the member whose role is being changed.
   */
  const handleRoleChange = (
    event: SelectChangeEvent<string>,
    memberId: string
  ) => {
    const newRole = event.target.value as TeamMember["role"];
    setTeamMembers((members) =>
      members.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  /**
   * Handles deleting a team member.
   *
   * @param {string} memberId - The ID of the member to delete.
   */
  const handleDeleteMember = (memberId: string) => {
    setTeamMembers((members) =>
      members.filter((member) => member.id !== memberId)
    );
  };

  const filteredMembers =
    filter === "All"
      ? teamMembers
      : teamMembers.filter((member) => member.role === filter);


      const handleSaveAllData = () => {
        const formData = {
          organizationName: orgName,
          filterRole: filter,
          teamMembers: teamMembers.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role
          }))
        };
      
        // Log the collected data
        console.log("Form Data:", formData);
      };

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

      <Box
        sx={{
          mb: 4,
          maxWidth: theme.spacing(480),
        }}
      >
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
                  onClick={() => setFilter(role)}
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
                  <TableCell sx={{ color: "#667085" }}>NAME</TableCell>
                  <TableCell sx={{ color: "#667085" }}>EMAIL</TableCell>
                  <TableCell sx={{ color: "#667085" }}>ROLE</TableCell>
                  <TableCell sx={{ color: "#667085" }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} sx={{ height: theme.spacing(1) }}>
                    <TableCell
                      sx={{ height: "80px !important", color: "#101828" }}
                    >
                      {member.name}
                    </TableCell>
                    <TableCell sx={{ color: "#667085" }}>
                      {member.email}
                    </TableCell>
                    <TableCell
                      sx={{
                        paddingLeft: 0,
                      }}
                    >
                      <Select
                        value={member.role}
                        onChange={(event) => handleRoleChange(event, member.id)}
                        size="small"
                        sx={{
                          textAlign: "left",
                          paddingLeft: 0,
                          marginLEft: 0,
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
                    <TableCell
                      sx={{
                        textAlign: "left",
                      }}
                    >
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteMember(member.id)}
                        sx={{
                          marginLeft: "16px",
                        }}
                      >
                        <img
                          src={Trashbin}
                          alt="Delete"
                          width={20}
                          height={20}
                          style={{
                            filter: "invert(0.5)",
                          }}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 20,
            }}
          >
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
}
