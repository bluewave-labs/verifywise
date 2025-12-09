import { Theme } from "@mui/material";

export const addNewStep = {
    gap: "8px",
    minWidth: "80px",
    height: "34px",
    border: "1px solid #D0D5DD",
    color: "#344054",
    "&:hover": {
        backgroundColor: "#F9FAFB",
        border: "1px solid #D0D5DD",
    },
};

export const stepNumberStyle = {
    display: "inline-flex",
    padding: "2px 8px",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    background: "#11725B",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    minWidth: "24px",
}

export const entitySelectStyle = (theme: Theme) => ({
    width: "50%",
    backgroundColor: theme.palette.background.main,
})

export const stepContainerStyle = (stepIndex: number) => ({
    pt: stepIndex > 0 ? 8 : 0
})

export const stepTitleStyle = {
    fontWeight: 500,
    fontSize: 16
}

export const removeStepLinkContainer = {
    flex: 1,
    display: "flex",
    justifyContent: "flex-start",
}

export const removeStepLinkStyle = (isFirstStep: boolean) => ({
    color: "#13715B",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    "&:hover": {
        color: "#0F5A47",
    },
    visibility: isFirstStep ? "hidden" : "visible",
})

export const verticalStepDividerStyle = {
    borderRightWidth: "1px",
    height: "216px",
    borderColor: "#E0E0E0",
    mt: 4,
    ml: 6,
    mr: 12,
}

export const stepFieldsContainer = {
    flex: 1
}

export const approverSelectStyle = (theme: Theme) => ({
    width: "48%",
    backgroundColor: theme.palette.background.main,
})

export const conditionsSelectStyle = (theme: Theme) => ({
    width: "52%",
    backgroundColor: theme.palette.background.main,
})

export const descriptionFieldStyle = {
    maxHeight: "115px"
}

