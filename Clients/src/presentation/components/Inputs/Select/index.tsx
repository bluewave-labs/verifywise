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
  items: { _id: string | number; name: string; email?: string }[];
  isRequired?: boolean;
  error?: string;
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
  isRequired,
  error,
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
    <Stack
      gap={theme.spacing(2)}
      className="select-wrapper"
      sx={{
        ".MuiOutlinedInput-notchedOutline": {
          border: error
            ? `1px solid ${theme.palette.status.error.border}!important`
            : `1px solid ${theme.palette.border.dark}!important`,
        },
        ".Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: error
            ? `1px solid ${theme.palette.status.error.border}!important`
            : `1px solid ${theme.palette.border.dark}!important`,
        },
      }}
    >
      {label && (
        <Typography
          color={theme.palette.text.secondary}
          fontWeight={500}
          fontSize={13}
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
                  backgroundColor: theme.palette.background.accent,
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.background.accent,
                  "&:hover": {
                    backgroundColor: theme.palette.background.accent,
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
        {items.map(
          (item: { _id: string | number; name: string; email?: string }) => (
            <MenuItem
              value={item._id}
              key={`${id}-${item._id}`}
              sx={{
                display: "flex",
                ...itemStyles,
                justifyContent: "space-between",
                flexDirection: "row",
              }}
            >
              {item.name}
              {item.email && (
                <span style={{ fontSize: 11, color: "#9d9d9d" }}>
                  email@email.com
                </span>
              )}
            </MenuItem>
          )
        )}
      </MuiSelect>
      {error && (
        <Typography
          component="span"
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
