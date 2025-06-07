import React from "react";
import { Select, MenuItem, FormControl, SelectChangeEvent, Typography } from "@mui/material";
import { dropdownStyles, inputStyles } from "./style";

interface StatusOption{
    name: string
}
const statusOptions: StatusOption[] = [
    { name: "Planned" },
    { name: "In Progress" },
    { name: "Completed" },
  ];
interface StatusOfProjectDropDownProps {
    selectedStatus: string;
    onChange: (value: string) => void;
}
const StatusOfProjectDropDown: React.FC<StatusOfProjectDropDownProps> = ({
    selectedStatus,
    onChange
}) => {
    return(
        <FormControl
        sx={{
            ...inputStyles,
            marginBottom: 10,
        }}
        >
            <Typography>Status</Typography>
            <Select
            id="status-of-project"
            value={selectedStatus || ""}
            onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
            displayEmpty
            sx={{
                ...inputStyles,
                ...dropdownStyles
            }}
            >
                <MenuItem value="all"></MenuItem>
                        {statusOptions.map((status) => (
                        <MenuItem  value={status.name}>
                        {status.name}
                          </MenuItem>
                        ))}
            </Select>
        </FormControl>
    )
}

export default StatusOfProjectDropDown;