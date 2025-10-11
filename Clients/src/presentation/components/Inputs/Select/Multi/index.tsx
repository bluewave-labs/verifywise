/**
 * This file is currently in use
 */

import {
  Select as MuiSelect,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import "./index.css";
import { ChevronDown } from "lucide-react";


interface CustomizableMultiSelectProps {
  label: string;
  required?: boolean;
  error?: boolean | string;
  value: string | number | (string | number)[];
  onChange: (
    event: SelectChangeEvent<string | number | (string | number)[]>,
    child: React.ReactNode
  ) => void;
  items: {
    _id: string | number;
    name: string;
    email?: string;
    surname?: string;
  }[];
  getOptionValue?: (item: any) => any;
  placeholder?: string;
  isHidden?: boolean;
  width?: number;
  sx?: object;
}

const CustomizableMultiSelect = ({
  label = "This is a multi-select",
  required = false,
  error,
  value = [],
  onChange,
  items,
  getOptionValue,
  placeholder,
  isHidden,
  width,
  sx,
}: CustomizableMultiSelectProps) => {
  const theme = useTheme();
  const itemStyles = {
    fontSize: "var(--env-var-font-size-medium)",
    color: theme.palette.text.tertiary,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2),
  };

  const renderValue = (value: unknown) => {
    const selected = value as (string | number)[];
    const selectedItems = items.filter((item) =>
      selected.includes(getOptionValue ? getOptionValue(item) : item._id)
    );
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selectedItems.map((item) => (
          <Chip
            key={getOptionValue ? getOptionValue(item) : item._id}
            label={item.name + (item.surname ? " " + item.surname : "")}
            sx={{
              borderRadius: "4px !important",
              height: 24,
              fontSize: 12,
            }}
          />
        ))}
      </Box>
    );
  };

  return (
    <Stack
      className="vw-multi-select"
      gap={theme.spacing(2)}
      sx={{
        width,
        ".MuiOutlinedInput-notchedOutline": {
          border: error
            ? `1px solid ${theme.palette.status.error.border}!important`
            : `1px solid ${theme.palette.border.dark}!important`,
        },
      }}
    >
      {label && (
        <Typography
          className="vw-multi-select-label"
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: 500,
            fontSize: 13,
            color: `${theme.palette.text.secondary}`,
          }}
        >
          {label}
          {required && (
            <Typography
              className="required"
              sx={{
                ml: theme.spacing(1),
                color: `${theme.palette.error.text}`,
              }}
            >
              *
            </Typography>
          )}
        </Typography>
      )}
      <MuiSelect
        id="vw-multi-select"
        className="select-component"
        value={value}
        onChange={onChange}
        multiple
        displayEmpty
        renderValue={renderValue}
        IconComponent={() => <ChevronDown size={16} />}
        error={!!error}
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
        sx={sx}
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
          (item: {
            _id: string | number;
            name: string;
            email?: string;
            surname?: string;
          }) => (
            <MenuItem
              value={getOptionValue ? getOptionValue(item) : item._id}
              key={`${item._id}`}
              sx={{
                display: "flex",
                ...itemStyles,
                justifyContent: "space-between",
                flexDirection: "row",
                gap: 1,
              }}
            >
              <span style={{ marginRight: 1 }}>{`${item.name} ${
                item.surname ? item.surname : ""
              }`}</span>
              {item.email && (
                <span
                  style={{ fontSize: 11, color: "#9d9d9d", marginLeft: "4px" }}
                >
                  {`${item.email}`}
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

export default CustomizableMultiSelect;
