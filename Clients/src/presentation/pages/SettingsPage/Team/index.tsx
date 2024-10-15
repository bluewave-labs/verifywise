import { useState } from "react";
import {
  Box,
  Button,
  TextField,
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
import Trashbin from "../../../../presentation/assets/icons/TrashCan.svg";

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
  const handleSaveOrgName = () => {
    console.log("Saving organization name:", orgName);
  };

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

  const handleDeleteMember = (memberId: string) => {
    setTeamMembers((members) =>
      members.filter((member) => member.id !== memberId)
    );
  };

  const filteredMembers =
    filter === "All"
      ? teamMembers
      : teamMembers.filter((member) => member.role === filter);

  return (
    <Stack sx={{ pt: theme.spacing(10) }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            flexGrow: 1,
            top: theme.spacing(2.5),
            fontSize: "18px",
            fontWeight: 600,
            color: "#1A1919",
          }}
        >
          Organization name
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <TextField
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSaveOrgName}
            sx={{
              ml: theme.spacing(10),
              width: theme.spacing(35),
              height: theme.spacing(17),
            }}
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
            fontSize: "18px",
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
                  variant={filter === role ? "contained" : "outlined"}
                  onClick={() => setFilter(role)}
                  sx={{
                    borderRadius: 0,
                    color: filter === role ? "#344054" : "#344054", // Text color
                    borderColor: "#EAECF0", // Border color for outlined
                    backgroundColor: filter === role ? "#EAECF0" : "transparent", // Background color for contained
                    "&:hover": {
                      backgroundColor: filter === role ? "#D0D4DA" : "transparent", // Hover state
                    },
                  }}
                >
                  {role}
                </Button>
              ))}
            </Box>

            <Box sx={{ mt: 10 }}>
              <Button variant="contained">Invite team member</Button>
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
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} sx={{ height: theme.spacing(1) }}>
                    <TableCell sx={{ height: "90px !important" }}>
                      {member.name}
                    </TableCell>
                    <TableCell sx={{ height: "90px !important" }}>
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onChange={(event) => handleRoleChange(event, member.id)}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none",
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
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <img
                          src={Trashbin}
                          alt="Delete"
                          width={"20px"}
                          height={"20px"}
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
            <Button variant="contained">Save</Button>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
