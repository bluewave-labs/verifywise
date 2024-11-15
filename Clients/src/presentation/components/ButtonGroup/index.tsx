import React, { useState } from "react";
import { ButtonGroup, Button, ButtonProps } from "@mui/material";
import { styled } from "@mui/system";

interface StyledButtonProps extends ButtonProps {
  isSelected?: boolean;
}

const StyledButtonGroup = styled(ButtonGroup)({
  borderRadius: "8px",
  overflow: "hidden",
  width: "384px",
  height: "49px",
});

const StyledButton = styled(Button)<StyledButtonProps>(
  ({ theme, isSelected }) => ({
    color: isSelected
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
    backgroundColor: isSelected
      ? theme.palette.primary.main
      : theme.palette.background.paper,
    borderColor: "transparent",
    fontWeight: isSelected ? "bold" : "normal",
    "&:hover": {
      backgroundColor: isSelected
        ? theme.palette.primary.dark
        : theme.palette.action.hover,
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
