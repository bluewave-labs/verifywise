import {
  Menu,
  MenuItem,
  IconButton as MuiIconButton,
  useTheme,
} from "@mui/material";
import { ReactComponent as Setting } from "../../assets/icons/setting.svg";
import { useState } from "react";
import BasicModal from "../Modals/Basic";
import AddNewVendor from "../Modals/NewVendor";

const IconButton = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [actions, setActions] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("1");

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

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const openAddNewVendor = () => {
    setIsOpen(true);
  };

  const closeMenu = (e: any) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <MuiIconButton
        disableRipple={
          theme.components?.MuiIconButton?.defaultProps?.disableRipple
        }
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
              "& li": {
                m: 0,
                fontSize: 13,
                "& .MuiTouchRipple-root": {
                  display: "none",
                },
              },
              "& li:hover": { borderRadius: 4 },
              "& li:last-of-type": {
                color: theme.palette.error.main,
              },
              boxShadow: theme.boxShadow,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            openAddNewVendor();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            openRemove(e);
          }}
        >
          Remove
        </MenuItem>
      </Menu>
      <BasicModal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} />
      <AddNewVendor
        isOpen={isOpen}
        handleChange={handleChange}
        setIsOpen={() => setIsOpen(false)}
        value={value}
      />
    </>
  );
};

export default IconButton;
