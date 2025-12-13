import { TablePlugin, TableRowPlugin, TableCellPlugin, TableCellHeaderPlugin } from "@platejs/table/react";
import TableToolbar from "./TableToolbar";
import { useEditorRef, useSelected } from "platejs/react";

/**
 * Custom Table Element component with floating toolbar
 */
export const TableElement = (props: any) => {
  const { attributes, children } = props;
  const editor = useEditorRef();
  const selected = useSelected();

  return (
    <div
      {...attributes}
      style={{
        position: "relative",
        margin: "12px 0",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          tableLayout: "fixed",
        }}
      >
        <tbody>{children}</tbody>
      </table>
      {selected && (
        <div
          contentEditable={false}
          style={{
            position: "absolute",
            bottom: "-44px",
            right: "0",
            zIndex: 10,
          }}
        >
          <TableToolbar editor={editor} />
        </div>
      )}
    </div>
  );
};

/**
 * Custom Table Row Element component
 */
export const TableRowElement = (props: any) => {
  const { attributes, children } = props;

  return <tr {...attributes}>{children}</tr>;
};

/**
 * Custom Table Cell Element component (for td)
 */
export const TableCellElement = (props: any) => {
  const { attributes, children } = props;

  return (
    <td
      {...attributes}
      style={{
        border: "1px solid #d0d5dd",
        padding: "8px 12px",
        textAlign: "left",
        verticalAlign: "top",
        backgroundColor: "transparent",
        minWidth: "80px",
      }}
    >
      {children}
    </td>
  );
};

/**
 * Custom Table Header Cell Element component (for th)
 */
export const TableCellHeaderElement = (props: any) => {
  const { attributes, children } = props;

  return (
    <th
      {...attributes}
      style={{
        border: "1px solid #d0d5dd",
        padding: "8px 12px",
        textAlign: "left",
        verticalAlign: "top",
        backgroundColor: "#f9fafb",
        fontWeight: 600,
        minWidth: "80px",
      }}
    >
      {children}
    </th>
  );
};

/**
 * Configured Table Plugins with custom element rendering
 */
export const tablePlugin = TablePlugin.configure({
  render: {
    node: TableElement,
  },
});

export const tableRowPlugin = TableRowPlugin.configure({
  render: {
    node: TableRowElement,
  },
});

export const tableCellPlugin = TableCellPlugin.configure({
  render: {
    node: TableCellElement,
  },
});

export const tableCellHeaderPlugin = TableCellHeaderPlugin.configure({
  render: {
    node: TableCellHeaderElement,
  },
});
