import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Checkbox as MuiCheckbox,
  useTheme,
} from "@mui/material";
import { Search, X } from "lucide-react";
import Field from "../../components/Inputs/Field";

interface OrgUser {
  id: number;
  name: string;
  surname?: string;
  email: string;
}

interface RecipientsPickerPanelProps {
  recipients: number[];
  onChange: (recipients: number[]) => void;
  orgUsers: OrgUser[];
}

export function RecipientsPickerPanel({
  recipients,
  onChange,
  orgUsers,
}: RecipientsPickerPanelProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orgUsers;
    return orgUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [orgUsers, search]);

  const selectedUsers = useMemo(
    () => orgUsers.filter((u) => recipients.includes(u.id)),
    [orgUsers, recipients]
  );

  const handleToggle = (userId: number) => {
    if (recipients.includes(userId)) {
      onChange(recipients.filter((id) => id !== userId));
    } else {
      onChange([...recipients, userId]);
    }
  };

  const handleRemoveChip = (userId: number) => {
    onChange(recipients.filter((id) => id !== userId));
  };

  return (
    <Box>
      {/* Selected recipients as chips */}
      {selectedUsers.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", mb: "8px" }}>
          {selectedUsers.map((user) => (
            <Box
              key={user.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                px: "8px",
                gap: "4px",
                fontSize: "12px",
                backgroundColor: theme.palette.background.fill,
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.border.dark}`,
                borderRadius: "4px",
              }}
            >
              {[user.name, user.surname].filter(Boolean).join(" ")}
              <Box
                onClick={() => handleRemoveChip(user.id)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  ml: "2px",
                  "&:hover": { color: theme.palette.status.error.text },
                }}
              >
                <X size={12} strokeWidth={1.5} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Search input */}
      <Field
        id="recipient-search"
        label=""
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: "flex", alignItems: "center", mr: "8px" }}>
              <Search size={14} strokeWidth={1.5} color={theme.palette.text.accent} />
            </Box>
          ),
        }}
        sx={{
          mb: "8px",
          "& .MuiOutlinedInput-root": { height: 34 },
        }}
      />

      {/* User list */}
      <Box
        sx={{
          maxHeight: 200,
          overflowY: "auto",
          border: `1px solid ${theme.palette.border.dark}`,
          borderRadius: "4px",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: theme.palette.border.dark, borderRadius: 2 },
        }}
      >
        {filteredUsers.length === 0 ? (
          <Box sx={{ px: 2, py: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: "13px", color: theme.palette.text.accent }}>
              No users found
            </Typography>
          </Box>
        ) : (
          filteredUsers.map((user, index) => {
            const isChecked = recipients.includes(user.id);
            const isLast = index === filteredUsers.length - 1;

            return (
              <Box
                key={user.id}
                onClick={() => handleToggle(user.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  px: "8px",
                  py: "6px",
                  cursor: "pointer",
                  borderBottom: isLast ? "none" : `1px solid ${theme.palette.border.light}`,
                  backgroundColor: isChecked ? theme.palette.background.fill : "transparent",
                  "&:hover": {
                    backgroundColor: isChecked ? theme.palette.background.fill : theme.palette.background.accent,
                  },
                }}
              >
                <MuiCheckbox
                  checked={isChecked}
                  size="small"
                  disableRipple
                  sx={{
                    p: 0,
                    color: theme.palette.border.dark,
                    "&.Mui-checked": { color: theme.palette.primary.main },
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ overflow: "hidden" }}>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: isChecked ? 500 : 400,
                      color: theme.palette.text.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {[user.name, user.surname].filter(Boolean).join(" ")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: theme.palette.text.accent,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Selection count summary */}
      {recipients.length > 0 && (
        <Typography sx={{ fontSize: "11px", color: theme.palette.primary.main, mt: "6px" }}>
          {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} selected
        </Typography>
      )}
    </Box>
  );
}

export default RecipientsPickerPanel;
