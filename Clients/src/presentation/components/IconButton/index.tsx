import {
  Button,
  Menu,
  MenuItem,
  Modal,
  IconButton as MuiIconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ReactComponent as Setting } from "../../assets/icons/setting.svg";
import { useState } from "react";

const IconButton = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [actions, setActions] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = (event: any, id: any, url: any) => {
    console.log("open menu");
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActions({ id: id, url: url });
    console.log(actions);
  };

  const openRemove = (e: any) => {
    closeMenu(e);
    setIsOpen(true);
  };

  const closeMenu = (e: any) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <MuiIconButton
        sx={{
          "&:focus": {
            outline: "none",
          },
          "& svg path": {
            stroke: theme.palette.other.icon,
          },
        }}
        onClick={(event) => {
          event.stopPropagation();
          openMenu(event, "someId", "someUrl");
        }}
      >
        <Setting />
      </MuiIconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={(e) => closeMenu(e)}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              "& ul": { p: theme.spacing(2.5) },
              "& li": { m: 0, fontSize: 13 },
              "& li:hover": { borderRadius: 4 },
              "& li:last-of-type": {
                color: theme.palette.error.main,
              },
              boxShadow: theme.boxShadow,
            },
          },
        }}
      >
        <MenuItem>Edit</MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            openRemove(e);
          }}
        >
          Remove
        </MenuItem>
      </Menu>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Stack
          gap={theme.spacing(2)}
          color={theme.palette.text.secondary}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            bgcolor: theme.palette.background.main,
            border: 1,
            borderColor: theme.palette.border,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 24,
            p: theme.spacing(15),
            "&:focus": {
              outline: "none",
            },
          }}
        >
          <Typography id="modal-delete-vendor" fontSize={16} fontWeight={600}>
            Delete this vendor?
          </Typography>
          <Typography
            id="delete-monitor-confirmation"
            fontSize={13}
            textAlign={"justify"}
          >
            When you delete this vendor, all data related to this vendor will be
            removed. This action is non-recoverable.
          </Typography>
          <Stack
            direction="row"
            gap={theme.spacing(4)}
            mt={theme.spacing(12)}
            justifyContent="flex-end"
          >
            <Button
              disableRipple
              disableFocusRipple
              disableTouchRipple
              variant="text"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              sx={{
                width: 100,
                textTransform: "capitalize",
                fontSize: 13,
                borderRadius: "4px",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "transparent",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              disableRipple
              disableFocusRipple
              disableTouchRipple
              variant="contained"
              color="error"
              sx={{
                width: 140,
                textTransform: "capitalize",
                fontSize: 13,
                backgroundColor: theme.palette.error.main,
                boxShadow: "none",
                borderRadius: "4px",
                "&:hover": {
                  boxShadow: "none",
                },
              }}
            >
              Delete vendor
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default IconButton;
