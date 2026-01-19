import { useTheme } from "@mui/material";

export const CategoryStyles = () => {
    const theme = useTheme();

    return {
        stackStyle: {
            display: 'flex',
            gap: theme.spacing(4),
        },
    };
};
