// style.ts
import { SxProps, Theme } from "@mui/material";

export const searchBoxStyle = (isSearchBarVisible: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  border: "1px solid #eaecf0",
  borderRadius: 1,
  p: "4px 6px",
  bgcolor: "#fff",
  width: isSearchBarVisible ? "23.8%" : "46px",
  transition: "all 0.3s ease",
  mb: 9,
});

export const inputStyle = (isSearchBarVisible: boolean): SxProps<Theme> => ({
  flex: 1,
  fontSize: "14px",
  opacity: isSearchBarVisible ? 1 : 0,
  transition: "opacity 0.3s ease",
});

export const noProjectsTextStyle: SxProps<Theme> = {
  color: "#666",
  textAlign: "left",
  mt: 3,
};

export const projectWrapperStyle = (count: number): SxProps<Theme> => ({
  width: count === 1 ? "50%" : "100%",
  display: "flex",
  flexDirection: "row",
  flexWrap: count < 4 ? "nowrap" : "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 2.5, // using theme spacing
});

export const vwhomeBodyProjectsGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 2.5,
};
