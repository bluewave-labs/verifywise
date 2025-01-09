import {
  Select as MuiSelect,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
  MenuItem,
} from "@mui/material";
import "./index.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface VWMultiSelectProps {
  label: string;
  required?: boolean;
  error?: boolean;
  value: string | number | (string | number)[];
  onChange: (
    event: SelectChangeEvent<string | number | (string | number)[]>,
    child: React.ReactNode
  ) => void;
  items: { _id: string | number; name: string; email?: string }[];
  getOptionValue?: (item: any) => any;
}

const VWMultiSelect = ({
  label = "This is a multi-select",
  required = true,
  error,
  value = [],
  onChange,
  items,
  getOptionValue,
}: VWMultiSelectProps) => {
  const theme = useTheme();

  return (
    <Stack
      className="vw-multi-select"
      gap={theme.spacing(2)}
      sx={{
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
        IconComponent={KeyboardArrowDownIcon}
        error={error}
      >
        {items.map((item) => (
          <MenuItem
            key={item._id}
            value={getOptionValue ? getOptionValue(item) : item._id}
          >
            {item.name}
          </MenuItem>
        ))}
      </MuiSelect>
    </Stack>
  );
};

export default VWMultiSelect;
