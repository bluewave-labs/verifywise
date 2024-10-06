import light from "../../themes/light";

export const styles = {
    card: {
        display: "flex",
        flexDirection: "column",
        minWidth: 300,
        width: "100%",
        maxWidth: "100%",
        padding: 6,
        pt: 12,
        border: `1px solid ${light.palette.border.light}`,
        borderRadius: light.shape.borderRadius,
        backgroundColor: "#FFFFFF",
      },
    title: {
      color: '#2D3748',
      font: light.typography,
      fontWeight: 600,
      mb: 6
    },
    subtitle: {
        color: '#8594AC', 
        fontSize: 11
    },
    subtitleValue: {
        color: light.palette.text.secondary,
        font: light.typography,
    },
    button: {
        textTransform: "none", 
        borderRadius: 2,
        maxHeight: 34,
        borderColor: light.palette.border.dark,
        color:  light.palette.text.secondary,
        boxShadow: "none",
        backgroundColor: "#fff",
        "&:hover": {
            boxShadow: "none",
        },
    },
    imageBox: {
        maxWidth: 18.24, 
        maxHeight: 18, 
        borderRadius: 2 
    },
    imageTitle: {
        color: '#8594AC', 
        fontSize: 12, 
        ml: 2
    },
    upperBox: {
        display: "flex", 
        justifyContent: "space-between", 
        mb: 10
    },
    lowerBox: {
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end", 
        mt: 15.5
    },
    progressBarTitle: {
        color: '#8594AC', 
        fontSize: 11,
        mb: 10.5, 
        mt: 1
    },
};