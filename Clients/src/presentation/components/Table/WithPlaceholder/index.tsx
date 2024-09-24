import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";

import Placeholder from "../../../assets/imgs/table placeholder 1.png";
import listOfVendors from "../../../mocks/vendors.data";
import IconButton from "../../IconButton";
import AddNewVendor from "../../Modals/NewVendor";
import { useState } from "react";

function TableWithPlaceholder({ data = listOfVendors }) {
  const theme = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("1");

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const openAddNewVendor = () => {
    setIsOpen(true);
  };

  const cellStyle = { fontSize: 13, paddingY: theme.spacing(15) };

  return (
    <TableContainer style={{ marginBottom: theme.spacing(15) }}>
      <Table
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          "& td, & th": {
            border: 0,
          },
        }}
      >
        <TableHead
          sx={{
            backgroundColor: "#FAFAFA",
          }}
        >
          <TableRow
            sx={{
              textTransform: "uppercase",
              borderBottom: "1px solid #EEEEEE",
            }}
          >
            {[
              "name",
              "type",
              "assignee",
              "status",
              "risk",
              "review date",
              "",
            ].map((cell, index) => (
              <TableCell style={{ color: "#667085" }} key={index}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data &&
            data.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  textTransform: "capitalize",
                  borderBottom: "1px solid #EEEEEE",
                  cursor: "pointer",
                }}
                onClick={() => {
                  openAddNewVendor();
                }}
              >
                <TableCell sx={cellStyle}>{row.name}</TableCell>
                <TableCell sx={cellStyle}>{row.type}</TableCell>
                <TableCell sx={cellStyle}>{row.assignee}</TableCell>
                <TableCell sx={cellStyle}>{row.status}</TableCell>
                <TableCell sx={cellStyle}>{row.risk}</TableCell>
                <TableCell sx={cellStyle}>{row.review_date}</TableCell>
                <TableCell sx={cellStyle}>
                  <IconButton />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!data && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid #EEEEEE",
            borderRadius: "4px",
            borderTop: "none",
            padding: theme.spacing(5),
            paddingBottom: theme.spacing(20),
          }}
        >
          <img src={Placeholder} alt="Placeholder" />
        </div>
      )}
      <AddNewVendor
        isOpen={isOpen}
        handleChange={handleChange}
        setIsOpen={() => setIsOpen(false)}
        value={value}
      />
    </TableContainer>
  );
}

export default TableWithPlaceholder;
