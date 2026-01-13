import { Stack } from "@mui/material";
import React from "react";
import Chip from "../../Chip";
import { CategoryStyles } from "./styles";

const CategoryChip: React.FC<{ categories: string[] }> = ({ categories }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <Stack direction="row" sx={CategoryStyles().stackStyle}>
            {categories.slice(0, 2).map((category) => (
                <Chip
                    key={category}
                    label={category}
                    size="small"
                    variant="info"
                />
            ))}
            {categories.length > 2 && (
                <Chip
                    label={`+${categories.length - 2}`}
                    size="small"
                />
            )}
        </Stack>
    );
}

export default CategoryChip;