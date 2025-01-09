import { SelectChangeEvent, Stack } from "@mui/material";
import VWMultiSelect from "../vw-v2-components/Selects/Multi";
import { useState } from "react";

const Playground = () => {
  // Define the data array
  const data = [
    {
      _id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      role: "Admin",
      action: "Edit",
    },
    {
      _id: 2,
      name: "Jane Doe",
      email: "jane.doe@email.com",
      role: "User",
      action: "View",
    },
    // ... other items
  ];

  const [selectedValue, setSelectedValue] = useState<
    string | number | (string | number)[]
  >([]);

  const handleChange = (
    event: SelectChangeEvent<string | number | (string | number)[]>
  ) => {
    setSelectedValue(event.target.value);
    console.log("Selected:", event.target.value);
  };

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
      <VWMultiSelect
        label="Select multiple items"
        required
        items={data}
        value={selectedValue}
        getOptionValue={(option) => option._id}
        onChange={handleChange}
      />
    </Stack>
  );
};

export default Playground;
