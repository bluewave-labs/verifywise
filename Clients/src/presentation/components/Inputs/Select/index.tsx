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
 * @returns {JSX.Element} The rendered select component.
 */

import {
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import "./index.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface SelectProps {
  id: string;
  label?: string;
  placeholder?: string;
  isHidden?: boolean;
  value: string | number;
  items: { _id: string | number; name: string }[];
  onChange: (
    event: SelectChangeEvent<string | number>,
    child: React.ReactNode
  ) => void;
  sx?: object;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  placeholder,
  isHidden,
  value,
  items,
  onChange,
  sx,
}) => {
  const theme = useTheme();
  const itemStyles = {
    fontSize: "var(--env-var-font-size-medium)",
    color: theme.palette.text.tertiary,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2),
  };

  return (
    <Stack gap={theme.spacing(2)} className="select-wrapper">
      {label && (
        <Typography
          component="h3"
          color={theme.palette.text.secondary}
          fontWeight={500}
          fontSize={13}
        >
          {label}
        </Typography>
      )}
      <MuiSelect
        className="select-component"
        value={value}
        onChange={onChange}
        displayEmpty
        inputProps={{ id: id }}
        IconComponent={KeyboardArrowDownIcon}
        MenuProps={{
          disableScrollLock: true,
          PaperProps: {
            sx: {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.boxShadow,
              mt: 1,
              "& .MuiMenuItem-root": {
                fontSize: 13,
                color: theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.action.selected,
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
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
          "& fieldset": {
            borderRadius: theme.shape.borderRadius,
            borderColor: theme.palette.border.dark,
            boxShadow: theme.boxShadow
          },
          "&:not(.Mui-focused):hover fieldset": {
            borderColor: theme.palette.border.dark,
          },
          "& svg path": {
            fill: theme.palette.other.icon,
          },
          ...sx,
        }}
      >
        {placeholder && (
          <MenuItem
            className="select-placeholder"
            value="0"
            sx={{
              display: isHidden ? "none" : "flex",
              visibility: isHidden ? "none" : "visible",
              ...itemStyles,
            }}
          >
            {placeholder}
          </MenuItem>
        )}
        {items.map((item: { _id: string | number; name: string }) => (
          <MenuItem
            value={item._id}
            key={`${id}-${item._id}`}
            sx={{
              ...itemStyles,
            }}
          >
            {item.name}
          </MenuItem>
        ))}
      </MuiSelect>
    </Stack>
  );
};

export default Select;
