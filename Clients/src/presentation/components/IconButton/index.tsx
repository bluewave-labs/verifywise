/**
 * IconButton component that renders a custom-styled Material-UI IconButton with a settings icon.
 * It includes a dropdown menu with options to edit or remove a vendor, and modals for adding or removing vendors.
 *
 * @component
 * @returns {JSX.Element} The rendered IconButton component with associated dropdown menu and modals.
 */

import {
  Menu,
  MenuItem,
  IconButton as MuiIconButton,
  useTheme,
} from "@mui/material";
import { ReactComponent as Setting } from "../../assets/icons/setting.svg";
import { useState } from "react";
import BasicModal from "../Modals/Basic";
import singleTheme from "../../themes/v1SingleTheme";
import Alert from "../Alert";

interface IconButtonProps {
  id: number;
  onDelete: () => void;
  onEdit: () => void;
  warningTitle: string;
  warningMessage: string;
  type:string;
  onMouseEvent: (event: React.SyntheticEvent) => void;
}

const IconButton: React.FC<IconButtonProps> = ({
  id,
  onDelete,
  onEdit,
  warningTitle,
  warningMessage,
  type,
  onMouseEvent,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [actions, setActions] = useState({});
  const [isOpenRemoveModal, setIsOpenRemoveModal] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const dropDownStyle = singleTheme.dropDownStyles.primary;

  /**
   * Handles the opening of a menu by preventing the default event behavior,
   * stopping event propagation, setting the anchor element, and updating the actions state.
   *
   * @param {any} id - The identifier associated with the menu item.
   * @param {any} event - The event object triggered by the user interaction.
   * @param {any} url - The URL associated with the menu item.
   */
  const openMenu = (event: any, id: any, url: any) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActions({ id: id, url: url });
    console.log(actions);
  };

  /**
   * Handles the action of opening the "Remove Vendor" dialog by closing the dropdown menu
   * and setting the state to open the remove vendor modal.
   *
   * @param {React.MouseEvent} e - The click event that triggers the function.
   */

  /**
   * Handles the change event for a component, updating the state with the new value.
   *
   * @param {React.SyntheticEvent} _ - The synthetic event object.
   * @param {string} newValue - The new value to set in the state.
   */
  /**
   * Handles the closing of the dropdown menu by stopping event propagation
   * and setting the anchor element to null.
   *
   * @param {React.SyntheticEvent} e - The event object triggered by the user interaction.
   */
  function closeDropDownMenu(e: React.SyntheticEvent) {
    e.stopPropagation();
    setAnchorEl(null);
  }

  const handleDelete = (e?: React.SyntheticEvent) => {
    onDelete();
    setIsOpenRemoveModal(false);

    if (e) {
      closeDropDownMenu(e);
    }
  };
  const handleEdit = (e?: React.SyntheticEvent) => {
    onEdit();
    if (e) {
      closeDropDownMenu(e);
      onMouseEvent(e);
    }
  };
  function handleCancle(e?: React.SyntheticEvent) {
    setIsOpenRemoveModal(false);
    if (e) {
      closeDropDownMenu(e);
    }
  }

  /**
   * List of context-specific dropdown actions used to render menu items.
   *
   * - For type "report", the menu item will be "download".
   * - For other types (e.g. "Vendor"), the menu item will be "edit", "remove".
   */
  const listOfButtons = type === "report" ? ["download"] : ["edit", "remove"];

  /**
   * Renders a dropdown menu with dynamic options (e.g., Edit, Download, Remove)
   * based on the context (e.g., "Vendor", "report", etc.).
   *
   * The menu is styled using the theme's dropdown styles. The "Remove" option is
   * conditionally styled in red, while others use default styling.
   *
   * The options are dynamically mapped from a list of button labels (`listOfButtons`),
   * which is determined by the `type` prop (e.g., "report" only shows "Download").
   *
   * @constant
   * @type {JSX.Element}
   *
   * @returns {JSX.Element} A Material-UI Menu component containing context-based actions.
   */
  const dropDownListOfOptions: JSX.Element = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={(e: React.SyntheticEvent) => closeDropDownMenu(e)}
      slotProps={{
        paper: {
          sx: dropDownStyle,
        },
      }}
    >
      {listOfButtons.map((item) => (
        <MenuItem
          key={item}
          onClick={(e) => {
            if (item === "edit" || item === "download") {
              handleEdit(e);
            } else if (item === "remove") {
              setIsOpenRemoveModal(true);
              if (e) closeDropDownMenu(e);
            }
          }}
          sx={item === "remove" ? { color: "#d32f2f" } : {}}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </MenuItem>
      ))}
    </Menu>
  );

  /**
   * Custom IconButton component styled as settings button.
   *
   * @constant
   * @type {JSX.Element}
   * @description This component renders a Material-UI IconButton with custom styles and behavior.
   * It disables the ripple effect if specified in the theme, removes the outline on focus,
   * and sets the stroke color of the SVG path to a custom color from the theme palette.
   * The button's onClick event handler stops the event propagation and opens a menu with specified parameters.
   *
   * @param {React.MouseEvent} event - The click event.
   * @param {string} someId - The ID to be used when opening the menu.
   * @param {string} someUrl - The URL to be used when opening the menu.
   *
   * @returns {JSX.Element} A styled IconButton component with a settings icon.
   */
  const customIconButtonAsSettings: JSX.Element = (
    <MuiIconButton
      disableRipple={
        theme.components?.MuiIconButton?.defaultProps?.disableRipple
      }
      sx={singleTheme.iconButtons}
      onClick={(event) => {
        event.stopPropagation();
        openMenu(event, id, "someUrl");
      }}
    >
      <Setting />
    </MuiIconButton>
  );

  return (
    <>
      {customIconButtonAsSettings}
      {dropDownListOfOptions}
      <BasicModal
        isOpen={isOpenRemoveModal}
        setIsOpen={() => setIsOpenRemoveModal(false)}
        onDelete={(e) => handleDelete(e)}
        warningTitle={warningTitle}
        warningMessage={warningMessage}
        onCancel={(e) => handleCancle(e)}
        type={type}
      />
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
    </>
  );
};

export default IconButton;