import React, { CSSProperties, useEffect, useState } from "react";
import PolicyForm, { FormData } from "./PolicyForm";
import { Policy } from "../../../domain/types/Policy";
import { Plate, PlateContent, createPlateEditor } from "platejs/react";
import { AutoformatPlugin } from '@platejs/autoformat';
import InsertImageModal from "../Modals/InsertImageModal/InsertImageModal";
import InsertLinkModal from "../Modals/InsertLinkModal/InsertLinkModal";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  StrikethroughPlugin
} from "@platejs/basic-nodes/react";
import { ListPlugin, BulletedListPlugin, NumberedListPlugin, ListItemPlugin, ListItemContentPlugin } from '@platejs/list-classic/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { serializeHtml } from "platejs";
import {
  Underline,
  Bold,
  Italic,
  SaveIcon,
  Strikethrough,
  ListOrdered,
  List,
  AlignLeft,
  AlignCenter,
  Link,
  AlignRight,
  Image,
  Redo2,
  Undo2
} from "lucide-react";

// Custom number components for heading levels (Lucide doesn't have numbered heading icons)
const LooksOne = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="600">1</text>
  </svg>
);

const LooksTwo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="600">2</text>
  </svg>
);

const LooksThree = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="600">3</text>
  </svg>
);

const FormatUnderlined = () => <Underline size={16} />;
const FormatBold = () => <Bold size={16} />;
const FormatItalic = () => <Italic size={16} />;
import { IconButton, Tooltip, useTheme, Box } from "@mui/material";
import { Drawer, Stack, Typography, Divider } from "@mui/material";
import { X as CloseGreyIcon } from "lucide-react";
import CustomizableButton from "../Button/CustomizableButton";
import {
  createPolicy,
  updatePolicy,
} from "../../../application/repository/policy.repository";
import useUsers from "../../../application/hooks/useUsers";
import { User } from "../../../domain/types/User";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import { useModalKeyHandling } from "../../../application/hooks/useModalKeyHandling";
import { linkPlugin } from "../PlatePlugins/CustomLinkPlugin";
import { imagePlugin, insertImage } from "../PlatePlugins/CustomImagePlugin";
import { insertLink } from "../PlatePlugins/CustomLinkPlugin";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../Alert";
import { AlertProps } from "../../../domain/interfaces/iAlert";


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
  content?: string;
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
  const [openLink, setOpenLink] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);

  // const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track toggle state for toolbar buttons
  type ToolbarKey =
    | "bold"
    | "italic"
    | "underline"
    | "h1"
    | "h2"
    | "h3"
    | "undo"
    | "redo"
    | "strike"
    | "ol"
    | "ul"
    | "align-left"
    | "align-center"
    | "align-right"
    | "link"
    | "image";

  const [toolbarState, setToolbarState] = useState<Record<ToolbarKey, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    undo: false,
    redo: false,
    strike: false,
    ol: false,
    ul: false,
    "align-left": false,
    "align-center": false,
    "align-right": false,
    link: false,
    image: false,
  });

  useModalKeyHandling({
    isOpen: true,
    onClose,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
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

    // Assigned reviewers validation
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
    status: "Under Review",
    tags: [],
    nextReviewDate: "",
    assignedReviewers: [],
    content: "",
  });

  // Create the editor with plugins
  const [editor] = useState(() =>
    createPlateEditor({
      plugins: [
        BoldPlugin,
        ItalicPlugin,
        UnderlinePlugin,
        H1Plugin,
        H2Plugin,
        H3Plugin,
        StrikethroughPlugin,
        imagePlugin,
        linkPlugin,
    ListPlugin,
    BulletedListPlugin.configure({
      shortcuts: { toggle: { keys: 'mod+alt+5' } },
    }),
    NumberedListPlugin.configure({
      shortcuts: { toggle: { keys: 'mod+alt+6' } },
    }),
    ListItemPlugin,
    ListItemContentPlugin,
        TextAlignPlugin.configure({
          inject: {
            nodeProps: {
              nodeKey: 'align',
              defaultNodeValue: 'start',
              styleKey: 'textAlign',
              validNodeValues: ['start', 'left', 'center', 'right', 'end', 'justify'],
            },
            targetPlugins: ['h1', 'h2', 'h3', 'p'],
          },
        }),
        AutoformatPlugin.configure({
          options: {
            rules: [],
          },
        }),
      ],
      value: [{ type: 'p', children: [{ text: '' }] }],
    }) as any
  );

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
        status: "Under Review",
        tags: [],
        nextReviewDate: "",
        assignedReviewers: [],
        content: "",
      });
    }
  }, [policy, users]);

  const toolbarConfig: Array<{
    key: ToolbarKey;
    title: string;
    icon: React.ReactNode;
    action: () => void;
  }> = [
    { key: "undo", title: "Undo", icon: <Undo2 size={16} />, action: () => editor.tf.undo() },
    { key: "redo", title: "Redo", icon: <Redo2 size={16} />, action: () => editor.tf.redo() },
    { key: "h1", title: "Heading 1", icon: <LooksOne />, action: () => editor.tf.h1.toggle() },
    { key: "h2", title: "Heading 2", icon: <LooksTwo />, action: () => editor.tf.h2.toggle() },
    { key: "h3", title: "Heading 3", icon: <LooksThree />, action: () => editor.tf.h3.toggle() },
    { key: "bold", title: "Bold", icon: <FormatBold />, action: () => editor.tf.bold.toggle() },
    { key: "italic", title: "Italic", icon: <FormatItalic />, action: () => editor.tf.italic.toggle() },
    { key: "underline", title: "Underline", icon: <FormatUnderlined />, action: () => editor.tf.underline.toggle() },
    { key: "strike", title: "Strikethrough", icon: <Strikethrough size={16} />, action: () => editor.tf.strikethrough.toggle() },
    { key: "ol", title: "Numbered List", icon: <ListOrdered size={16} />, action: () => editor.tf.ol.toggle() },
    { key: "ul", title: "Bulleted List", icon: <List size={16} />, action: () => editor.tf.ul.toggle() },
    {
      key: "align-left",
      title: "Align Left",
      icon: <AlignLeft size={16} />,
      action: () => editor.tf.textAlign.setNodes("left"),
    },
    {
      key: "align-center",
      title: "Align Center",
      icon: <AlignCenter size={16} />,
      action: () => editor.tf.textAlign.setNodes("center"),
    },
    {
      key: "align-right",
      title: "Align Right",
      icon: <AlignRight size={16} />,
      action: () => editor.tf.textAlign.setNodes("right"),
    },
    { key: "link", title: "Insert Link", icon: <Link size={16} />, action: () => setOpenLink(true)},
    { key: "image", title: "Insert Image", icon: <Image size={16} />,   action: () => setOpenImage(true)},
  ];

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

      // Show success alert using VerifyWise standard pattern
      handleAlert({
        variant: "success",
        body: isNew
          ? "Policy created successfully!"
          : "Policy updated successfully!",
        setAlert,
        alertTimeout: 4000, // 4 seconds to give users time to read
      });

      // Delay closing the modal to allow user to see the success message
      setTimeout(() => {
        onSaved();
      }, 2000);
    } catch (err: any) {
      // setIsSubmitting(false);
      console.error("Full error object:", err);
      console.error("Original error:", err?.originalError);
      console.error("Original error response:", err?.originalError?.response);
      
      // Handle server validation errors - the CustomException is in originalError
      const errorData = err?.originalError?.response || err?.response?.data || err?.response;
      console.error("Error data:", errorData);
      
      if (errorData?.errors) {
        console.error("Processing server errors:", errorData.errors);
        const serverErrors: FormErrors = {};
        errorData.errors.forEach((error: any) => {
          console.error("Processing error:", error);
          if (error.field === 'title') {
            serverErrors.title = error.message;
          } else if (error.field === 'status') {
            serverErrors.status = error.message;
          } else if (error.field === 'tags') {
            serverErrors.tags = error.message;
          } else if (error.field === 'content_html') {
            serverErrors.content = error.message;
          } else if (error.field === 'next_review_date') {
            serverErrors.nextReviewDate = error.message;
          } else if (error.field === 'assigned_reviewer_ids') {
            serverErrors.assignedReviewers = error.message;
          }
        });
        console.error("Setting server errors:", serverErrors);
        setErrors(serverErrors);
      } else {
        console.error("No errors found in response");
      }
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
      <InsertLinkModal
        open={openLink}
        onClose={() => setOpenLink(false)}
        onInsert={(url, text) => insertLink(editor, url, text)}
      />

      <InsertImageModal
        open={openImage}
        onClose={() => setOpenImage(false)}
        onInsert={(url, alt) => insertImage(editor, url, alt)}
      />
      <Drawer
        open={true}
        onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        anchor="right"
        sx={{
          width: 900,
          "& .MuiDrawer-paper": {
            width: 900,
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
          <CloseGreyIcon size={16}
            style={{ color: "#98A2B3", cursor: "pointer" }}
            onClick={onClose}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2} sx={{ marginBottom: "80px" }}>
          <PolicyForm
            formData={formData}
            setFormData={setFormData}
            tags={tags}
            errors={errors}
            setErrors={setErrors}
          />
          <Stack sx={{ width: "100%", height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap", // allow multiple lines
                gap: 1,
                mb: 2,
              }}
            >
              {/* Toolbar */}
              {toolbarConfig.map(({ key, title, icon, action }) => (
                <Tooltip key={title} title={title}>
                  <IconButton
                    onClick={() => {
                      action?.();
                      setToolbarState(prev => ({ ...prev, [key]: !prev[key] }));
                    }}
                    size="small"
                    sx={{
                      padding: "6px",
                      borderRadius: "3px",
                      backgroundColor: toolbarState[key] ? "#E0F7FA" : "#FFFFFF",
                      border: "1px solid",
                      borderColor: toolbarState[key] ? "#13715B" : "transparent",
                      "&:hover": {
                        backgroundColor: "#F5F5F5",
                      },
                    }}
                  >
                    {icon}
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
                  height: "calc(100vh - 280px)", // Dynamic height: viewport minus header, form, toolbar, and save button area
                  minHeight: "300px", // Minimum height for usability
                  overflowY: "auto",
                  padding: "16px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "3px",
                  backgroundColor: "#FFFFFF",
                  fontSize: theme.typography.fontSize,
                  color: theme.palette.text.primary,
                  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                  "&:focus": {
                    outline: "none",
                  }
                } as CSSProperties}
                placeholder="Start typing..."
              />
            </Plate>
            {errors.content && (
              <Typography
                component="span"
                color={theme.palette.status?.error?.text || theme.palette.error.main}
                sx={{
                  opacity: 0.8,
                  fontSize: 11,
                  mt: 1,
                }}
              >
                {errors.content}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 20,                      // match drawer padding
            width: 430,                     // half of content width (860/2) to align with right column
            p: 1,
            backgroundColor: "#fff",        // give it a background to overlap content
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
            icon={<SaveIcon size={16} />}
          />
        </Box>
      </Drawer>

      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
    </>
  );
};

export default PolicyDetailModal;