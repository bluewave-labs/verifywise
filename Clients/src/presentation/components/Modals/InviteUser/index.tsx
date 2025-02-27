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

import {
  Button,
  Modal,
  Stack,
  Typography,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import React, { useState } from "react";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { checkStringValidation } from "../../../../application/validations/stringValidation";

interface InviteUserModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendInvite: (email: string, status: number | string) => void;
}

interface FormValues {
  name: string;
  email: string;
  role: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
}

const initialState: FormValues = {
  name: "",
  email: "",
  role: "",
};

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  setIsOpen,
  onSendInvite,
}) => {
  const theme = useTheme();

  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleFormFieldChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    };

  const handleOnSelectChange =
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const name = checkStringValidation("Name", values.name, 1, 64);
    if (!name.accepted) {
      newErrors.name = name.message;
    }

    const email = checkStringValidation("Email", values.email, 1, 64);
    if (!email.accepted) {
      newErrors.email = email.message;
    }

    const role = checkStringValidation("Role", values.role, 1, 64);
    if (!role.accepted) {
      newErrors.role = role.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendInvitation = async () => {
    if (validateForm()) {
      const formData = {
        to: values.email,
        email: values.email,
        name: values.name,
        role: values.role,
      };

      try {
        const response = await apiServices.post("/mail/invite", formData);
        onSendInvite(values.email, response.status);
      } catch (error) {
        onSendInvite(values.email, "error");
      } finally {
        setIsOpen(false);
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") {
          setIsOpen(false);
        }
      }}
    >
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
          padding: theme.spacing(18),
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
        <Stack gap={theme.spacing(12)}>
          <Field
            placeholder="Name"
            type="name"
            value={values.name}
            onChange={handleFormFieldChange("name")}
            isRequired
            error={errors.name}
          />
          <Field
            placeholder="Email"
            type="email"
            value={values.email}
            onChange={handleFormFieldChange("email")}
            isRequired
            error={errors.email}
          />
          <Select
            id="role-select"
            value={values.role}
            onChange={handleOnSelectChange("role")}
            items={[
              { _id: "administrator", name: "Administrator" },
              { _id: "reviewer", name: "Reviewer" },
              { _id: "editor", name: "Editor" },
            ]}
            placeholder="Please select a role"
            error={errors.role}
            isRequired
          />
        </Stack>
        <Stack
          direction="row"
          gap={theme.spacing(4)}
          mt={theme.spacing(4)}
          justifyContent="flex-end"
          paddingTop={theme.spacing(8)}
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
            type="submit"
            variant="contained"
            color="primary"
            // disabled={!email || !role}
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
            onClick={handleSendInvitation}
          >
            Send Invite
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default InviteUserModal;
