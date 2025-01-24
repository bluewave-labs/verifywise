/**
 * A modal component that displays a form for inviting a user.
 *
 * @component
 * @param {InviteUserModalProps} props - The properties for the InviteUserModal component.
 * @param {boolean} props.isOpen - A boolean indicating whether the modal is open.
 * @param {function} props.setIsOpen - A function to set the modal's open state.
 * @param {function} props.onSendInvite - A function to handle sending the invite.
 *
 * @returns {JSX.Element} The rendered modal component.
 *
 * @example
 * <InviteUserModal isOpen={isOpen} setIsOpen={setIsOpen} onSendInvite={handleSendInvite} />
 */

import { Button, Modal, Stack, Typography, useTheme } from "@mui/material";
import React, { useState } from "react";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";

interface InviteUserModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendInvite: (email: string, role: string) => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  setIsOpen,
  onSendInvite,
}) => {
  const theme = useTheme();

  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");

  const handleSendInvite = () => {
    onSendInvite(email, role);
    setIsOpen(false);
  };

  return (
    <Modal open={isOpen}
    onClose={(_event, reason) => {
      if (reason !== 'backdropClick') {
          setIsOpen(false);
      }
    }}>
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          bgcolor: theme.palette.background.paper,
          border: 1,
          borderColor: theme.palette.border.dark,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(4),
          padding: theme.spacing(12),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Typography id="modal-invite-user" fontSize={16} fontWeight={600}>
          Invite new team member
        </Typography>
        <Typography
          id="invite-user-instructions"
          fontSize={13}
          textAlign={"justify"}
          paddingBottom={theme.spacing(8)}
        >
          When you add a new team member, they will get access to all monitors.
        </Typography>
        <Field
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isRequired
          sx={{
            marginBottom: theme.spacing(4),
          }}
        />
        <Select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as string)}
          items={[
            { _id: "administrator", name: "Administrator" },
            { _id: "reviewer", name: "Reviewer" },
            { _id: "editor", name: "Editor" },
          ]}
          sx={{ mt: theme.spacing(2) }}
        />
        <Stack
          direction="row"
          gap={theme.spacing(4)}
          mt={theme.spacing(4)}
          justifyContent="flex-end"
          paddingBottom={theme.spacing(4)}
        >
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="text"
            color="inherit"
            onClick={() => setIsOpen(false)}
            sx={{
              width: 100,
              textTransform: "capitalize",
              fontSize: 13,
              borderRadius: "4px",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: "transparent",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color="primary"
            disabled={!email || !role}
            sx={{
              width: 140,
              textTransform: "capitalize",
              fontSize: 13,
              boxShadow: "none",
              borderRadius: "4px",
              "&:hover": {
                boxShadow: "none",
              },
            }}
            onClick={handleSendInvite}
          >
            Send Invite
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default InviteUserModal;
