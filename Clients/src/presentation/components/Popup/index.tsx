import { Button, Box, Typography } from "@mui/material";
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
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchor(anchor ? null : event.currentTarget);
    };
  
    const open = Boolean(anchor);
    const id = open ? popupId : undefined;

    return (
        <div>
            <Button aria-describedby={id} type="button" variant="contained" onClick={handleClick}
                sx={{ textTransform: "none", borderRadius: 2, maxHeight: 34 }}>
                {openPopupButtonName}
            </Button>
            <BasePopup id={id} open={open} anchor={anchor} style={{ 
                position: "fixed",
                transform: "none",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#D9D9D980"
            }}>
                <Box sx={{
                    position: "relative",
                    backgroundColor: "#FCFCFD",
                    borderRadius: 2,
                    m: "auto",
                    pt: 14.5,
                    pb: 39.5,
                    pl: 19,
                    pr: 22.5,
                    transform: "translateY(50%)",
                    width: "fit-content"
                }}>
                    <Typography variant="h1" component="div" sx={{ color: "#344054", fontSize: 16, fontWeight: 600, mb: 3.5 }}>
                        {popupTitle}
                    </Typography>
                    {popupSubtitle && <Typography variant="subtitle1" component="div" sx={{ color: "#344054", fontSize: 13, mb: 13.5 }}>
                        {popupSubtitle}
                    </Typography>}
                    <Button onClick={handleClick} 
                        sx={{ position: "absolute",  right: 28, top: 21, minWidth: 36, height: 36, p: 0, color: "#98A2B3"}}>
                        <ClearIcon/>
                    </Button>
                    {popupContent}
                    <Button variant="contained"
                        sx={{ textTransform: "none", borderRadius: 2, maxHeight: 34, position: "absolute", right: 45, bottom: 34 }}>
                        {actionButtonName}
                    </Button>
                </Box>
            </BasePopup>
        </div>
    )
}

export default Popup;