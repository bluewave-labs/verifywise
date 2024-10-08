import { Button, Box, Typography, useTheme } from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import React from "react";
import { FC } from "react";
import { Unstable_Popup as BasePopup } from '@mui/base/Unstable_Popup';

interface PopupProps {
    popupId: string,
    popupContent: React.ReactNode,
    openPopupButtonName: string,
    actionButtonName: string,
    popupTitle: string,
    popupSubtitle?: string
}

const Popup: FC<PopupProps> = ({
    popupId,
    popupContent,
    openPopupButtonName,
    actionButtonName,
    popupTitle,
    popupSubtitle
}) => {
    const theme = useTheme();
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
    };
    const open = Boolean(anchor);
    const id = open ? popupId : undefined;

    const styles = {
        openPopupButton: {
            width: 120, height: 34,
            fontSize: 13,
            textTransform: "inherit",
            backgroundColor: "#4C7DE7",
            boxShadow: "none",
            borderRadius: 2,
            border: "1px solid #175CD3",
            "&:hover": { boxShadow: "none" }
        },
        closePopupButton: {
            position: "absolute",
            right: 28, top: 21,
            minWidth: 36, height: 36,
            p: 0,
            color: "#98A2B3",
            "&:hover": { background: "none" }
        },
        popupContent: {
            position: "relative",
            backgroundColor: "#FCFCFD",
            borderRadius: 2,
            pt: 14.5, pb: 39.5, pl: 19, pr: 22.5,
            width: "fit-content"
        },
        actionButton: {
            borderRadius: 2, maxHeight: 34,
            position: "absolute",
            right: 45, bottom: 34,
            textTransform: "inherit",
            backgroundColor: "#4C7DE7",
            boxShadow: "none",
            border: "1px solid #175CD3",
            "&:hover": { boxShadow: "none" }
        }
    }

    return (
        <div>
            <Button aria-describedby={id} type="button" variant="contained" onClick={handleClick}
                sx={styles.openPopupButton} disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
            >
                {openPopupButtonName}
            </Button>
            <BasePopup id={id} open={open} anchor={anchor} style={{
                position: "fixed",
                transform: "none",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#D9D9D980",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <Box sx={styles.popupContent}>
                    <Typography variant="h1" component="div" sx={{ color: "#344054", fontSize: 16, fontWeight: 600, mb: 3.5 }}>
                        {popupTitle}
                    </Typography>
                    {popupSubtitle && <Typography variant="subtitle1" component="div" sx={{ color: "#344054", fontSize: 13, mb: 13.5 }}>
                        {popupSubtitle}
                    </Typography>}
                    <Button onClick={handleClick} sx={styles.closePopupButton}>
                        <ClearIcon />
                    </Button>
                    {popupContent}
                    <Button variant="contained" disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple} sx={styles.actionButton}>
                        {actionButtonName}
                    </Button>
                </Box>
            </BasePopup>
        </div>
    )
}

export default Popup;