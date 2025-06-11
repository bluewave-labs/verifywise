import { Button, Typography, useTheme, Stack } from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import React from "react";
import { FC } from "react";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";

interface PopupProps {
  popupId: string;
  popupContent: React.ReactNode;
  openPopupButtonName: string;
  popupTitle: string;
  popupSubtitle?: string;
  handleOpenOrClose?: (event: React.MouseEvent<HTMLElement>) => void;
  anchor: null | HTMLElement;
}

const Popup: FC<PopupProps> = ({
  popupId,
  popupContent,
  openPopupButtonName,
  popupTitle,
  popupSubtitle,
  handleOpenOrClose,
  anchor,
}) => {
  const theme = useTheme();
  const open = Boolean(anchor);
  const id = open ? popupId : undefined;

  const styles = {
    openPopupButton: {
      width: 120,
      height: 34,
      fontSize: 13,
      textTransform: "inherit",
      backgroundColor: "#4C7DE7",
      boxShadow: "none",
      borderRadius: 2,
      border: "1px solid #175CD3",
      "&:hover": { boxShadow: "none", backgroundColor: "#175CD3 " },
      display: "none",
    },
    closePopupButton: {
      position: "absolute",
      right: 28,
      top: 21,
      minWidth: 36,
      height: 36,
      p: 0,
      color: "#98A2B3",
      "&:hover": { background: "none" },
    },
    popupContent: {
      position: "relative",
      backgroundColor: theme.palette.background.alt,
      borderRadius: 2,
      pt: 15,
      pb: 15,
      pl: 15,
      pr: 15,
      maxHeight: 650,
      width: "fit-content",
      overflow: "auto",
    },
    actionButton: {
      borderRadius: 2,
      maxHeight: 34,
      textTransform: "inherit",
      backgroundColor: "#4C7DE7",
      boxShadow: "none",
      border: "1px solid #175CD3",
      ml: "auto",
      mr: 0,
      mt: "30px",
      "&:hover": { boxShadow: "none" },
    },
  };

  return (
    <>
      <Button
        aria-describedby={id}
        type="button"
        variant="contained"
        onClick={handleOpenOrClose}
        sx={styles.openPopupButton}
        disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
      >
        {openPopupButtonName}
      </Button>
      <BasePopup
        className="Popup"
        id={id}
        open={open}
        anchor={anchor}
        style={{
          position: "fixed",
          transform: "none",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack sx={styles.popupContent} className="PopupContent">
          <Typography
            variant="h1"
            component="div"
            sx={{ color: "#344054", fontSize: 16, fontWeight: 600, mb: 3.5 }}
          >
            {popupTitle}
          </Typography>
          {popupSubtitle && (
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ color: "#344054", fontSize: 13 }}
            >
              {popupSubtitle}
            </Typography>
          )}
          <Button onClick={handleOpenOrClose} sx={styles.closePopupButton}>
            <ClearIcon />
          </Button>
          {popupContent}
        </Stack>
      </BasePopup>
    </>
  );
};

export default Popup;
