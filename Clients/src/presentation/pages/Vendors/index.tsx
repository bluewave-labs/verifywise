import "./index.css";
import { Button, Stack, Typography, useTheme } from "@mui/material";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder";
import { useState } from "react";

import AddNewVendor from "../../components/Modals/NewVendor";
import singleTheme from "../../themes/v1SingleTheme";

const Vendors = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("1");

  const openAddNewVendor = () => {
    setIsOpen(true);
  };

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <div className="vendors-page">
      <Stack gap={theme.spacing(10)} maxWidth={1400}>
        <Stack>
          <Typography sx={singleTheme.textStyles.pageTitle}>
            Vendors list
          </Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            This table includes a list of external entity that provides
            AI-related products, services, or components. You can create and
            manage all vendors here.
          </Typography>
        </Stack>
        <Stack
          sx={{
            alignItems: "flex-end",
          }}
        >
          <Button
            disableRipple={
              theme.components?.MuiButton?.defaultProps?.disableRipple
            }
            variant="contained"
            sx={{
              ...singleTheme.buttons.primary,
              width: 150,
              height: 34,
              "&:hover": {
                backgroundColor: "#175CD3 ",
              },
            }}
            onClick={() => {
              openAddNewVendor();
            }}
          >
            Add new vendor
          </Button>
        </Stack>
        <TableWithPlaceholder />
      </Stack>
      <AddNewVendor
        isOpen={isOpen}
        handleChange={handleChange}
        setIsOpen={() => setIsOpen(false)}
        value={value}
      />
    </div>
  );
};

export default Vendors;
