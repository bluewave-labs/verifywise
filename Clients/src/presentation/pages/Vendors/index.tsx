import { Button, Stack, Typography, useTheme } from "@mui/material";
import "./index.css";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder";
import { useState } from "react";

import AddNewVendor from "../../components/Modals/NewVendor";

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
      <Stack gap={theme.spacing(10)}>
        <Stack>
          <Typography fontSize={16} color="#1A1919" fontWeight={600}>
            Vendors list
          </Typography>
          <Typography fontSize={13} color="#344054">
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
              width: 150,
              height: 34,
              fontSize: 13,
              textTransform: "capitalize",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              borderRadius: "4px",
              border: "1px solid #175CD3",
              "&:hover": {
                boxShadow: "none",
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
