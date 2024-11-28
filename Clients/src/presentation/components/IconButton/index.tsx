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
import { useContext, useState } from "react";
import BasicModal from "../Modals/Basic";
import AddNewVendor from "../Modals/NewVendor";
import singleTheme from "../../themes/v1SingleTheme";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { deleteEntityById } from "../../../application/repository/entity.repository";
import { logEngine } from "../../../application/tools/log.engine";
import Alert from "../Alert";

const IconButton = ({ vendorId }: { vendorId: number }) => {
  const theme = useTheme();
  const { setDashboardValues } = useContext(VerifyWiseContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actions, setActions] = useState({});
  const [isOpenRemoveVendorModal, setIsOpenRemoveVendorModal] = useState(false);
  const [isOpenAddNewVendorModal, setIsOpenAddNewVendorModal] = useState(false);
  const [value, setValue] = useState("1");
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
  function openRemoveVendor(e: React.MouseEvent) {
    closeDropDownMenu(e);
    setIsOpenRemoveVendorModal(true);
  }

  /**
   * Handles the change event for a component, updating the state with the new value.
   *
   * @param {React.SyntheticEvent} _ - The synthetic event object.
   * @param {string} newValue - The new value to set in the state.
   */
  function handleChange(_: React.SyntheticEvent, newValue: string) {
    setValue(newValue);
  }

  /**
   * Handles the action of opening the "Add New Vendor" dialog by setting the state to open the add new vendor modal.
   */
  function openAddNewVendor() {
    setIsOpenAddNewVendorModal(true);
  }

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

  const handleDeleteVendor = async () => {
    const user = {
      id: "At delete vendor level", // Replace with actual user ID
      email: "N/A", // Replace with actual user email
      firstname: "N/A", // Replace with actual user first name
      lastname: "N/A", // Replace with actual user last name
    };

    try {
      const response = await deleteEntityById({
        routeUrl: `/vendors/${vendorId}`,
      });

      if (response.status === 202) {
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          vendors: prevValues.vendors.filter(
            (vendor: any) => vendor.id !== vendorId
          ),
        }));
        setAlert({
          variant: "success",
          body: "Vendor deleted successfully.",
        });
        logEngine({
          type: "info",
          message: "Vendor deleted successfully.",
          user,
        });
        setIsOpenRemoveVendorModal(false);
      } else if (response.status === 404) {
        setAlert({
          variant: "error",
          body: "Vendor not found.",
        });
        logEngine({
          type: "error",
          message: "Vendor not found.",
          user,
        });
      } else {
        setAlert({
          variant: "error",
          body: "Unexpected response. Please try again.",
        });
        logEngine({
          type: "error",
          message: "Unexpected response. Please try again.",
          user,
        });
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      setAlert({
        variant: "error",
        body: "An error occurred. Please try again.",
      });
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
        user,
      });
    } finally {
      setTimeout(() => setAlert(null), 3000);
    }
  };

  /**
   * A dropdown list of options rendered as a Material-UI Menu component.
   *
   * @constant
   * @type {JSX.Element}
   *
   * @param {HTMLElement} anchorEl - The HTML element used to set the position of the dropdown menu.
   * @param {boolean} open - Boolean value indicating whether the dropdown menu is open.
   * @param {function} onClose - Function to handle the closing of the dropdown menu.
   * @param {object} slotProps - Additional properties for customizing the dropdown menu.
   * @param {object} slotProps.paper - Custom styles for the dropdown menu paper.
   * @param {object} slotProps.paper.sx - Custom styles applied to the dropdown menu.
   * @param {function} openAddNewVendor - Function to handle the action of opening the "Add New Vendor" dialog.
   * @param {function} openRemoveVendor - Function to handle the action of opening the "Remove Vendor" dialog.
   *
   * @returns {JSX.Element} The rendered dropdown menu with "Edit" and "Remove" options.
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
          openRemoveVendor(e);
        }}
      >
        Remove
      </MenuItem>
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
        openMenu(event, vendorId, "someUrl");
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
        isOpen={isOpenRemoveVendorModal}
        setIsOpen={() => setIsOpenRemoveVendorModal(false)}
        onDelete={handleDeleteVendor}
      />
      <AddNewVendor // the usage here is as the edit window
        isOpen={isOpenAddNewVendorModal}
        handleChange={handleChange}
        setIsOpen={() => setIsOpenAddNewVendorModal(false)}
        value={value}
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
