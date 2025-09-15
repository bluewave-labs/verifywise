// style.ts
import { SxProps, Theme } from "@mui/material";

export const searchBoxStyle =
    (isSearchBarVisible: boolean): SxProps<Theme> =>
    (theme: Theme) => ({
        display: "flex",
        alignItems: "center",
        border: `1px solid ${theme.palette.border.dark}`, // adjust as needed
        borderRadius: theme.shape.borderRadius,
        p: "4px 6px",
        bgcolor: "#fff",
        width: isSearchBarVisible ? "23.8%" : "40px",
        transition: "all 0.3s ease",
        mb: 9,
    });

export const inputStyle = (isSearchBarVisible: boolean): SxProps<Theme> => ({
    flex: 1,
    fontSize: "14px",
    opacity: isSearchBarVisible ? 1 : 0,
    transition: "opacity 0.3s ease",
});
