/**
 * A custom select component that wraps Material-UI's Select component.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.id - The unique identifier for the select input.
 * @param {string} [props.label] - The label for the select input.
 * @param {string} [props.placeholder] - The placeholder text for the select input.
 * @param {boolean} [props.isHidden] - Flag to determine if the placeholder should be hidden.
 * @param {string | number} props.value - The current value of the select input.
 * @param {Array<{ _id: string | number; name: string }>} props.items - The list of items to display in the select dropdown.
 * @param {function} props.onChange - The callback function to handle changes in the select input.
 * @param {object} [props.sx] - Additional styles to apply to the select component.
 * @param {function} props.getOptionValue - The function to get the value of an option.
 * @param {boolean} [props.disabled] - Flag to determine if the select input is disabled.
 * @returns {JSX.Element} The rendered select component.
 */

import {
  MenuItem,
  Select as MuiSelect,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import "./index.css";
import { ChevronDown } from "lucide-react";
import { SelectProps } from "../../../../domain/interfaces/iWidget";
import { getSelectStyles } from "../../../utils/inputStyles";

const Select: React.FC<SelectProps> = ({
  id,
  label,
  placeholder,
  value,
  items,
  isRequired,
  error,
  onChange,
  sx,
  getOptionValue,
  disabled,
  customRenderValue,
  isFilterApplied = false,
}) => {
  const theme = useTheme();
  const itemStyles = {
    fontSize: "var(--env-var-font-size-medium)",
    color: theme.palette.text.tertiary,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2),
  };

  // Extract width, flexGrow, minWidth, maxWidth from sx prop to apply to wrapper Stack
  const extractedLayoutProps = sx && typeof sx === 'object' && !Array.isArray(sx)
    ? {
        width: (sx as any).width,
        flexGrow: (sx as any).flexGrow,
        minWidth: (sx as any).minWidth,
        maxWidth: (sx as any).maxWidth,
      }
    : {};

  // Create a copy of sx without layout props to pass to MuiSelect
  const sxWithoutLayoutProps = sx && typeof sx === 'object' && !Array.isArray(sx)
    ? Object.fromEntries(Object.entries(sx).filter(([key]) => !['width', 'flexGrow', 'minWidth', 'maxWidth'].includes(key)))
    : sx;

  const renderValue = (value: unknown) => {
    const selected = value as string | number;
    const selectedItem = items.find(
      (item) => (getOptionValue ? getOptionValue(item) : item._id) === selected
    );

    let displayText;
    if (customRenderValue && selectedItem) {
      displayText = customRenderValue(value, selectedItem);
    } else {
      displayText = selectedItem
        ? selectedItem.name +
          (selectedItem.surname ? " " + selectedItem.surname : "")
        : placeholder;
    }

    return (
      <span
        style={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        {displayText}
      </span>
    );
  };

  return (
    <Stack
      gap={theme.spacing(2)}
      className="select-wrapper"
      sx={extractedLayoutProps}
    >
      {label && (
        <Typography
          component="p"
          variant="body1"
          color={theme.palette.text.secondary}
          fontWeight={500}
          fontSize={"13px"}
          sx={{
            margin: 0,
            height: '22px',
            display: "flex",
            alignItems: "center",
          }}
        >
          {label}
          {isRequired && (
            <Typography
              component="span"
              ml={theme.spacing(1)}
              color={theme.palette.error.text}
            >
              *
            </Typography>
          )}
        </Typography>
      )}
      <MuiSelect
        className="select-component"
        value={value}
        onChange={onChange}
        displayEmpty
        inputProps={{ id: id }}
        renderValue={renderValue}
        IconComponent={() => (
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: theme.palette.text.tertiary
            }}
          />
        )}
        disabled={disabled}
        MenuProps={{
          disableScrollLock: true,
          style: { zIndex: 10001 },
          PaperProps: {
            sx: {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.boxShadow,
              mt: 1,
              "& .MuiMenuItem-root": {
                fontSize: 13,
                color: theme.palette.text.primary,
                transition: "color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: theme.palette.background.accent,
                  color: "#13715B",
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.background.accent,
                  "&:hover": {
                    backgroundColor: theme.palette.background.accent,
                    color: "#13715B",
                  },
                },
                "& .MuiTouchRipple-root": {
                  display: "none",
                },
              },
            },
          },
        }}
        sx={{
          fontSize: 13,
          minWidth: "125px",
          width: "100%",
          backgroundColor: isFilterApplied ? theme.palette.background.fill : theme.palette.background.main,
          position: "relative",
          cursor: "pointer",
          ...getSelectStyles(theme, { hasError: !!error }),
          ...sxWithoutLayoutProps,
        }}
      >
        {items.map(
          (item: {
            _id: string | number;
            name: string;
            email?: string;
            surname?: string;
          }) => (
            <MenuItem
              value={getOptionValue ? getOptionValue(item) : item._id}
              key={`${id}-${item._id}`}
              sx={{
                display: "flex",
                ...itemStyles,
                justifyContent: "space-between",
                flexDirection: "row",
              }}
            >
              {`${item.name} ${item.surname ? item.surname : ""}`}
              {item.email && (
                <span style={{ fontSize: 11, color: "#9d9d9d" }}>
                  {item.email}
                </span>
              )}
            </MenuItem>
          )
        )}
      </MuiSelect>
      {error && (
        <Typography
          className="input-error"
          color={theme.palette.status.error.text}
          mt={theme.spacing(2)}
          sx={{
            opacity: 0.8,
            fontSize: 11,
          }}
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
};

export default Select;
