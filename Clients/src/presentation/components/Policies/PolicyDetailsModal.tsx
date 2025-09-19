import React, { useEffect, useState } from "react";
import PolicyForm, { FormData } from "./PolicyForm";
import { Policy } from "../../../domain/types/Policy";
import { ReactComponent as SaveIconSVGWhite } from "../../assets/icons/save-white.svg";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from "@platejs/basic-nodes/react";
import { serializeHtml } from "platejs";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatQuote,
  LooksOne,
  LooksTwo,
  Looks3,
} from "@mui/icons-material";
import { IconButton, Tooltip, useTheme, Box } from "@mui/material";
import { Drawer, Stack, Typography, Divider } from "@mui/material";
import { ReactComponent as CloseGreyIcon } from "../../assets/icons/close-grey.svg";
import CustomizableButton from "../Button/CustomizableButton";
import {
  createPolicy,
  updatePolicy,
} from "../../../application/repository/policy.repository";
import useUsers from "../../../application/hooks/useUsers";
import { User } from "../../../domain/types/User";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import { useModalKeyHandling } from "../../../application/hooks/useModalKeyHandling";

interface Props {
  policy: Policy | null;
  tags: string[];
  onClose: () => void;
  onSaved: () => void;
}

export interface FormErrors {
  title?: string;
  status?: string;
  tags?: string;
  nextReviewDate?: string;
  assignedReviewers?: string;
}

const PolicyDetailModal: React.FC<Props> = ({
  policy,
  tags,
  onClose,
  onSaved,
}) => {
  const isNew = !policy;
  const { users } = useUsers();
  const theme = useTheme();
  const [errors, setErrors] = useState<FormErrors>({});
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // Track toggle state for toolbar buttons
  type ToolbarKey =
    | "bold"
    | "italic"
    | "underline"
    | "h1"
    | "h2"
    | "h3"
    | "blockquote";
  const [toolbarState, setToolbarState] = useState<Record<ToolbarKey, boolean>>(
    {
      bold: false,
      italic: false,
      underline: false,
      h1: false,
      h2: false,
      h3: false,
      blockquote: false,
    }
  );

  useModalKeyHandling({
    isOpen: true,
    onClose,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const policyTitle = checkStringValidation(
      "Policy title",
      formData.title,
      1,
      64
    );
    if (!policyTitle.accepted) {
      newErrors.title = policyTitle.message;
    }
    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    const policyTags = formData.tags.filter((tag) => tag.trim() !== "");
    if (policyTags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }

    const policyNextReviewDate = checkStringValidation(
      "Next review date",
      formData.nextReviewDate || "",
      1
    );
    if (!policyNextReviewDate.accepted) {
      newErrors.nextReviewDate = policyNextReviewDate.message;
    }

    const policyAssignedReviewers = formData.assignedReviewers.filter(
      (user) => user.id !== undefined
    );
    if (policyAssignedReviewers.length === 0) {
      newErrors.assignedReviewers = "At least one reviewer is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [formData, setFormData] = useState<FormData>({
    title: "",
    status: "Draft",
    tags: [],
    nextReviewDate: "",
    assignedReviewers: [],
    content: "",
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        title: policy.title,
        status: policy.status,
        tags: policy.tags || [],
        nextReviewDate: policy.next_review_date
          ? new Date(policy.next_review_date).toISOString().slice(0, 10)
          : "",
        assignedReviewers: policy.assigned_reviewer_ids
          ? policy.assigned_reviewer_ids
              .map((i) => users.find((user) => user.id === i))
              .filter((user): user is User => user !== undefined)
          : [],
        content: policy.content_html || "",
      });
    } else {
      setFormData({
        title: "",
        status: "Draft",
        tags: [],
        nextReviewDate: "",
        assignedReviewers: [],
        content: "",
      });
    }
  }, [policy, users]);

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      BlockquotePlugin,
    ],
    value: formData.content || "<p></p>",
  }) as any;

  useEffect(() => {
    if (policy && editor) {
      const api = editor.api.html;
      const nodes =
        typeof policy.content_html === "string"
          ? api.deserialize({
              element: Object.assign(document.createElement("div"), {
                innerHTML: policy.content_html,
              }),
            })
          : policy.content_html || editor.children;

      editor.tf.reset();
      editor.tf.setValue(nodes);
    }
  }, [policy, editor]);

  const save = async () => {
    if (!validateForm()) {
      return;
    }
    // setIsSubmitting(true);
    const html = await serializeHtml(editor);
    const assignedReviewers = formData.assignedReviewers.map((user) => user.id);
    const payload = {
      title: formData.title,
      status: formData.status,
      tags: formData.tags,
      content_html: html,
      next_review_date: formData.nextReviewDate
        ? new Date(formData.nextReviewDate)
        : undefined,
      assigned_reviewer_ids: assignedReviewers,
    };

    try {
      if (isNew) {
        await createPolicy(payload);
      } else {
        await updatePolicy(policy!.id, payload);
      }
      onSaved();
    } catch (err) {
      // setIsSubmitting(false);
      console.error(err);
    }
  };

  return (
    <>
      {/* {isSubmitting && (
      <Stack
        sx={{
          width: "100vw",
          height: "100%",
          position: "fixed",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
        }}
      >
        <CustomizableToast title="Creating project. Please wait..." />
      </Stack>
      )} */}
      <Drawer
        open={true}
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        anchor="right"
        sx={{
          width: 800,
          "& .MuiDrawer-paper": {
            width: 800,
            borderRadius: 0,
            padding: "15px 20px",
            marginTop: "0",
          },
        }}
      >
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Stack>
            <Typography
              sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
            >
              {isNew ? "Create new policy" : formData.title}
            </Typography>
          </Stack>
          <CloseGreyIcon
            style={{ color: "#98A2B3", cursor: "pointer" }}
            onClick={onClose}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={4} sx={{
            paddingBottom: 30, // leaves space so content won't hide under Save button
          }}>
          <PolicyForm
            formData={formData}
            setFormData={setFormData}
            tags={tags}
            errors={errors}
            setErrors={setErrors}
          />
          <Divider sx={{ my: 2 }} />
          <Stack sx={{ width: "100%" }}>
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                fontWeight: 500,
                mb: 2,
              }}
            >
              Content
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              {/* Toolbar */}
              {(
                [
                  {
                    key: "bold",
                    title: "Bold",
                    icon: <FormatBold />,
                    action: () => {
                      editor.tf.bold.toggle();
                      setToolbarState((prev) => ({
                        ...prev,
                        bold: !prev.bold,
                      }));
                    },
                  },
                  {
                    key: "italic",
                    title: "Italic",
                    icon: <FormatItalic />,
                    action: () => {
                      editor.tf.italic.toggle();
                      setToolbarState((prev) => ({
                        ...prev,
                        italic: !prev.italic,
                      }));
                    },
                  },
                  {
                    key: "underline",
                    title: "Underline",
                    icon: <FormatUnderlined />,
                    action: () => {
                      editor.tf.underline.toggle();
                      setToolbarState((prev) => ({
                        ...prev,
                        underline: !prev.underline,
                      }));
                    },
                  },
                  {
                    key: "h1",
                    title: "Heading 1",
                    icon: <LooksOne />,
                    action: () => {
                      editor.tf.h1.toggle();
                      setToolbarState((prev) => ({ ...prev, h1: !prev.h1 }));
                    },
                  },
                  {
                    key: "h2",
                    title: "Heading 2",
                    icon: <LooksTwo />,
                    action: () => {
                      editor.tf.h2.toggle();
                      setToolbarState((prev) => ({ ...prev, h2: !prev.h2 }));
                    },
                  },
                  {
                    key: "h3",
                    title: "Heading 3",
                    icon: <Looks3 />,
                    action: () => {
                      editor.tf.h3.toggle();
                      setToolbarState((prev) => ({ ...prev, h3: !prev.h3 }));
                    },
                  },
                  {
                    key: "blockquote",
                    title: "Blockquote",
                    icon: <FormatQuote />,
                    action: () => {
                      editor.tf.blockquote.toggle();
                      setToolbarState((prev) => ({
                        ...prev,
                        blockquote: !prev.blockquote,
                      }));
                    },
                  },
                ] as Array<{
                  key: ToolbarKey;
                  title: string;
                  icon: JSX.Element;
                  action: () => void;
                }>
              ).map(({ key, title, icon, action }) => (
                <Tooltip key={title} title={title}>
                  <IconButton
                    onClick={action}
                    disableRipple
                    size="small"
                    sx={{
                      padding: "6px",
                      borderRadius: "3px",
                      backgroundColor: toolbarState[key]
                        ? "#E0F7FA"
                        : "#FFFFFF",
                      boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                      border: "1px solid",
                      borderColor: toolbarState[key]
                        ? "#13715B"
                        : "transparent",
                      outline: toolbarState[key] ? "1px solid #13715B" : "none",
                      mr: 1,
                      transition:
                        "border-color 0.2s ease, outline 0.2s ease, background-color 0.2s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.background.main,
                        borderColor: toolbarState[key] ? "#13715B" : "#888", // preserve selection color
                        outline: "1px solid rgba(0, 0, 0, 0.08)", // subtle hover outline
                      },
                    }}
                  >
                    {icon}
                    {toolbarState[key]}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
            <Plate
              editor={editor}
              onChange={({ value }) =>
                setFormData((prev) => ({
                  ...prev,
                  content: value,
                }))
              }
            >
              <PlateContent
                style={{
                  minHeight: "400px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  padding: "16px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "3px",
                  backgroundColor: "#FFFFFF",
                  fontSize: theme.typography.fontSize,
                  color: theme.palette.text.primary,
                  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                }}
                placeholder="Start typing..."
              />
            </Plate>
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "fixed",            
            bottom: 0,
            right: 0,
            width: 800,                     // same width as Drawer
            p: 2,
            backgroundColor: "#fff",        // give it a background to overlap content
            borderTop: "1px solid #E0E0E0", 
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 1201,                   // above Drawer content
          }}
        >
          <CustomizableButton
            variant="contained"
            text="Save"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
              "&:hover": {
                backgroundColor: "#0F5B4D",
                borderColor: "#0F5B4D",
              },
            }}
            onClick={save}
            icon={<SaveIconSVGWhite />}
          />
        </Box>
      </Drawer>
    </>
  );
};

export default PolicyDetailModal;
