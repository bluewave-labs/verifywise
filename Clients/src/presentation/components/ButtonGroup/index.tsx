import React, { useState } from "react";
import { ButtonGroup, Button, ButtonProps } from "@mui/material";
import { styled } from "@mui/system";

interface StyledButtonProps extends ButtonProps {
  isSelected?: boolean;
}

const StyledButtonGroup = styled(ButtonGroup)({
  borderRadius: "4px",
  overflow: "hidden",
  border:'1px solid rgba(0,0,0,0.1)'
});

const StyledButton = styled(Button)<StyledButtonProps>(
  ({ theme, isSelected }) => ({
    color: isSelected
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
    backgroundColor: isSelected
      ? theme.palette.primary.main
      : '#f0f0f0',
    borderColor: "rgba(0,0,0,0.1)",
    fontWeight: isSelected ? "bold" : "normal",
    border:'1px solid rgba(0,0,0,0.1)',
    borderRadius: 0
,    "&:hover": {
      backgroundColor: isSelected
        ? theme.palette.primary.dark
        : '#e0e0e0',
    },
    padding: "8px 16px",
    textTransform: "none",
  })
);

const RoleButtonGroup: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>("All");

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  return (
    <StyledButtonGroup
      variant="outlined"
      aria-label="role selection button group"
    >
      {["All", "Administrator", "Editor", "Reviewer"].map((role) => (
        <StyledButton
          key={role}
          onClick={() => handleRoleChange(role)}
          isSelected={selectedRole === role}
        >
          {role}
        </StyledButton>
      ))}
    </StyledButtonGroup>
  );
};

export default RoleButtonGroup;
