/**
 * Search component that provides an autocomplete input for selecting team members.
 *
 * This component uses Material-UI's `Autocomplete`, `Box`, `Chip`, `TextField`, and `useTheme`
 * to create a styled input field that allows multiple selections from a predefined list of team members.
 *
 * @component
 * @example
 * return (
 *   <Search />
 * )
 *
 * @returns {JSX.Element} The rendered Search component.
 */

import { Autocomplete, Box, Chip, TextField, useTheme } from "@mui/material";
import "./index.css";

const teamMembers = [
  { title: "John Doe" },
  { title: "Jane Smith" },
  { title: "Alex Johnson" },
  { title: "Emily Davis" },
  { title: "Michael Brown" },
  { title: "Jessica Wilson" },
  { title: "David Martinez" },
  { title: "Sarah Lee" },
  { title: "Daniel Harris" },
  { title: "Laura Clark" },
];

export default function Search() {
  const theme = useTheme();

  return (
    <Box padding={theme.spacing(2)}>
      <Autocomplete
        multiple
        id="tags-outlined"
        options={teamMembers}
        getOptionLabel={(option) => option.title}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField {...params} label="Team Members" placeholder="Favorites" />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option.title}
              {...getTagProps({ index })}
            />
          ))
        }
      />
    </Box>
  );
}
