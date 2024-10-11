/**
 * TableWithPlaceholder component renders a table with a placeholder image when no data is provided.
 * It displays a table header and a body populated with rows from the provided data.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {Array} props.data - The array of data objects to be displayed in the table. Defaults to listOfVendors.
 * @returns {JSX.Element} The rendered TableWithPlaceholder component.
 *
 * @example
 * // Example usage of TableWithPlaceholder
 * const data = [
 *   { name: "Vendor A", type: "Type 1", assignee: "John Doe", status: "Active", risk: "Low", review_date: "2023-01-01" },
 *   { name: "Vendor B", type: "Type 2", assignee: "Jane Smith", status: "Inactive", risk: "High", review_date: "2023-02-01" }
 * ];
 *
 * <TableWithPlaceholder data={data} />
 */

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

/**
 * An array of strings representing the titles of the table columns.
 * The columns include:
 * - "name": The name of the item.
 * - "type": The type of the item.
 * - "assignee": The person assigned to the item.
 * - "status": The current status of the item.
 * - "risk": The risk level associated with the item.
 * - "review date": The date when the item was last reviewed.
 * - "": An empty string for a column with no title.
 */
const titleOfTableColumns = [
  "name",
  "type",
  "assignee",
  "status",
  "risk",
  "review date",
  "",
];

const TableWithPlaceholder = ({ data = listOfVendors }) => {
  const theme = useTheme();

  const cellStyle = { fontSize: 13, paddingY: theme.spacing(6) };

  /**
   * Renders the table header with specified styles and column titles.
   *
   * @constant
   * @type {JSX.Element}
   *
   * @remarks
   * The table header is styled with a light background color and uppercase text.
   * Each column title is styled with a specific color, font weight, and padding.
   *
   * @param {Array<string>} titleOfTableColumns - An array of strings representing the titles of the table columns.
   *
   * @returns {JSX.Element} The table header component.
   */
  const tableHeader: JSX.Element = (
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
        {titleOfTableColumns.map((cell, index) => (
          <TableCell
            style={{
              color: "#a1afc6",
              fontWeight: 400,
              paddingLeft: "16px",
            }}
            key={index}
          >
            {cell}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  /**
   * Renders the body of a table with rows populated from the provided data.
   * Each row displays various properties of the data object such as name, type, assignee, status, risk, and review date.
   * An IconButton is also rendered in the last cell of each row.
   *
   * @constant
   * @type {JSX.Element}
   * @param {Array} data - The array of data objects to be displayed in the table.
   * @param {Object} row - The individual data object representing a row in the table.
   * @param {number} index - The index of the current row in the data array.
   * @param {Object} row.name - The name property of the data object.
   * @param {Object} row.type - The type property of the data object.
   * @param {Object} row.assignee - The assignee property of the data object.
   * @param {Object} row.status - The status property of the data object.
   * @param {Object} row.risk - The risk property of the data object.
   * @param {Object} row.review_date - The review date property of the data object.
   * @param {Object} cellStyle - The style object applied to each TableCell.
   * @returns {JSX.Element} The rendered table body with rows.
   */
  const tableBody: JSX.Element = (
    <TableBody>
      {data &&
        data.map((row, index) => (
          <TableRow
            key={index}
            sx={{
              textTransform: "capitalize",
              borderBottom: "1px solid #EEEEEE",
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
  );

  return (
    <TableContainer>
      <Table
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          "& td, & th": {
            border: 0,
          },
        }}
      >
        {tableHeader}
        {tableBody}
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
    </TableContainer>
  );
};

export default TableWithPlaceholder;
