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
  Box,
} from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import ForwardToInboxIcon from "@mui/icons-material/ForwardToInbox";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { useRoles } from "../../../../application/hooks/useRoles";
import { isValidEmail } from "../../../../application/validations/emailAddress.rule";

interface InviteUserModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendInvite: (email: string, status: number | string, link: string) => void;
}

interface FormValues {
  name: string;
  email: string;
  roleId: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  roleId?: string;
}

const initialState: FormValues = {
  name: "",
  email: "",
  roleId: "1",
};

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  setIsOpen,
  onSendInvite,
}) => {
  const theme = useTheme();
  const { roles } = useRoles();

  const roleItems = useMemo(
    () =>
      roles.map((role) => ({
        _id: role.id.toString(),
        name: role.name,
      })),
    [roles]
  );

  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form and set initial role when modal opens
  useEffect(() => {
    if (isOpen && roles.length > 0) {
      setValues({
        ...initialState,
        roleId: roles[0].id.toString(),
      });
      setErrors({});
    }
  }, [isOpen, roles]);

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

    if (!isValidEmail(values.email)) {
      newErrors.email = "Invalid email address";
    }

    const roleId = checkStringValidation("Role", values.roleId, 1, 64);
    if (!roleId.accepted) {
      newErrors.roleId = roleId.message;
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
        roleId: values.roleId,
      };

      try {
        const response = await apiServices.post("/mail/invite", formData);
        const data = response.data as { link: string };
        onSendInvite(values.email, response.status, data.link);
      } catch (error) {
        onSendInvite(
          values.email,
          "error",
          (error as Error).message || "Failed to send invite"
        );
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
          <Stack direction="row" alignItems="center" spacing={2} width="100%">
            <Box flexGrow={1}>
              <Select
                id="role-select"
                value={values.roleId}
                onChange={handleOnSelectChange("roleId")}
                items={roleItems}
                error={errors.roleId}
                isRequired
              />
            </Box>
          </Stack>
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

          <CustomizableButton
            variant="contained"
            text="Send Invite"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            icon={<ForwardToInboxIcon />}
            onClick={() => handleSendInvitation()}
          />
        </Stack>
      </Stack>
    </Modal>
  );
};

export default InviteUserModal;
