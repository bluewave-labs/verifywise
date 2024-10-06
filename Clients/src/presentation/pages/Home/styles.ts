import light from "../../themes/light";

export const styles = {
    title: {
      color: "#1A1919",
      fontSize: 16,
      fontWeight: 600,
    },
    projectBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      mb: 9,
    },
    noProjectBox: {
      display: "block",
      width: "100%",
      border: `1px solid ${light.palette.border.light}`,
      borderRadius: 2,
      backgroundColor: light.palette.background.main,
      pt: 34,
      pb: 39.5,
    },
    title2: {
      color: "#1A1919",
      fontSize: 16,
      fontWeight: 500,
      pb: 8.5,
      mt: 17,
    },
    grid: {
      display: "flex",
      flexDirection: "column",
      border: `1px solid ${light.palette.border.light}`,
      borderRadius: 2,
      backgroundColor: light.palette.background.main,
      minWidth: 300,
      width: "100%",
      maxWidth: "100%",
      paddingX: 10,
      paddingY: 5,
    },
    gridTitle: {
      fontSize: 12,
      color: "#8594AC",
      pb: 1.5,
    },
    gridValue: {
      fontSize: 16,
      fontWeight: 600,
      color: '#2D3748',
    }
}