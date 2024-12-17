import { Stack } from "@mui/material";
import VWTable from "../vw-v2-components";

const data = [
  {
    id: 1,
    name: "Alice Smith",
    email: "alice.smith@email.com",
    role: "User",
    action: "View",
  },
  {
    id: 2,
    name: "Bob Johnson",
    email: "bob.johnson@email.com",
    role: "Admin",
    action: "Edit",
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie.brown@email.com",
    role: "User",
    action: "Delete",
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.wilson@email.com",
    role: "Moderator",
    action: "Edit",
  },
  {
    id: 5,
    name: "Eve Davis",
    email: "eve.davis@email.com",
    role: "User",
    action: "View",
  },
  {
    id: 6,
    name: "Frank Miller",
    email: "frank.miller@email.com",
    role: "Admin",
    action: "Edit",
  },
  {
    id: 7,
    name: "Grace Lee",
    email: "grace.lee@email.com",
    role: "User",
    action: "Delete",
  },
  {
    id: 8,
    name: "Hannah White",
    email: "hannah.white@email.com",
    role: "Moderator",
    action: "View",
  },
  {
    id: 9,
    name: "Ian Clark",
    email: "ian.clark@email.com",
    role: "User",
    action: "Edit",
  },
  {
    id: 10,
    name: "Jack Lewis",
    email: "jack.lewis@email.com",
    role: "Admin",
    action: "Delete",
  },
  {
    id: 11,
    name: "Karen Walker",
    email: "karen.walker@email.com",
    role: "User",
    action: "View",
  },
  {
    id: 12,
    name: "Larry Hall",
    email: "larry.hall@email.com",
    role: "Moderator",
    action: "Edit",
  },
  {
    id: 13,
    name: "Megan Young",
    email: "megan.young@email.com",
    role: "User",
    action: "Delete",
  },
  {
    id: 14,
    name: "Nathan King",
    email: "nathan.king@email.com",
    role: "Admin",
    action: "View",
  },
  {
    id: 15,
    name: "Olivia Scott",
    email: "olivia.scott@email.com",
    role: "User",
    action: "Edit",
  },
  {
    id: 16,
    name: "Paul Adams",
    email: "paul.adams@email.com",
    role: "Moderator",
    action: "Delete",
  },
  {
    id: 17,
    name: "Quincy Baker",
    email: "quincy.baker@email.com",
    role: "User",
    action: "View",
  },
  {
    id: 18,
    name: "Rachel Carter",
    email: "rachel.carter@email.com",
    role: "Admin",
    action: "Edit",
  },
  {
    id: 19,
    name: "Steve Evans",
    email: "steve.evans@email.com",
    role: "User",
    action: "Delete",
  },
  {
    id: 20,
    name: "Tina Harris",
    email: "tina.harris@email.com",
    role: "Moderator",
    action: "View",
  },
];

const Playground = () => {
  return (
    <Stack
      sx={{
        margin: "auto",
        padding: 20,
        width: "80%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 4,
      }}
    >
      <VWTable
        id={"vw-table"}
        cols={[
          {
            id: 1,
            name: "Name",
          },
          {
            id: 2,
            name: "Email",
          },
          {
            id: 3,
            name: "Role",
          },
          {
            id: 4,
            name: "Action",
          },
        ]}
        rows={data}
      />
    </Stack>
  );
};

export default Playground;
