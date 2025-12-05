import React, { CSSProperties, useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import PolicyForm from "./PolicyForm";
import { PolicyFormErrors, PolicyDetailModalProps, PolicyFormData } from "../../../domain/interfaces/IPolicy";
import { Plate, PlateContent, createPlateEditor } from "platejs/react";
import { AutoformatPlugin } from "@platejs/autoformat";
import InsertImageUploaderModal from "../Modals/InsertImageModal/InsertImageUploaderModal";
import InsertLinkModal from "../Modals/InsertLinkModal/InsertLinkModal";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  StrikethroughPlugin,
} from "@platejs/basic-nodes/react";
import {
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  ListItemPlugin,
  ListItemContentPlugin,
} from "@platejs/list-classic/react";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
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
  Undo2,
  History as HistoryIcon,
} from "lucide-react";

const FormatUnderlined = () => <Underline size={16} />;
const FormatBold = () => <Bold size={16} />;
const FormatItalic = () => <Italic size={16} />;
import { IconButton, Tooltip, useTheme, Box, Select, MenuItem } from "@mui/material";
import { Drawer, Stack, Typography, Divider } from "@mui/material";
import { X as CloseGreyIcon } from "lucide-react";
import CustomizableButton from "../Button/CustomizableButton";
import HistorySidebar from "../Common/HistorySidebar";
import { usePolicyChangeHistory } from "../../../application/hooks/usePolicyChangeHistory";
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


const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policy,
  tags,
  template,
  onClose,
  onSaved,
}) => {
  const isNew = !policy;
  const { users } = useUsers();
  const theme = useTheme();
  const [errors, setErrors] = useState<PolicyFormErrors>({});
  const [openLink, setOpenLink] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  // Prefetch history data when drawer opens in edit mode
  usePolicyChangeHistory(!isNew && policy?.id ? policy.id : undefined);

  // const [isSubmitting, setIsSubmitting] = useState(false);

  // Track toggle state for toolbar buttons
  type ToolbarKey =
    | "bold"
    | "italic"
    | "underline"
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

  const [toolbarState, setToolbarState] = useState<Record<ToolbarKey, boolean>>(
    {
      bold: false,
      italic: false,
      underline: false,
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
    }
  );

  // Track current block type for heading dropdown
  const [currentBlockType, setCurrentBlockType] = useState<string>('p');

  const handleClose = () => {
    setFormData({
      title: "",
      status: "Under Review",
      tags: [],
      nextReviewDate: "",
      assignedReviewers: [],
      content: "",
    });
    setIsHistorySidebarOpen(false);
    onClose();
  }

  useModalKeyHandling({
    isOpen: true,
    onClose: handleClose,
  });

  const validateForm = (): boolean => {
    const newErrors: PolicyFormErrors = {};

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

  const [formData, setFormData] = useState<PolicyFormData>({
    title: "",
    status: "Under Review",
    tags: [],
    nextReviewDate: "",
    assignedReviewers: [],
    content: "",
  });

  // Create the editor with plugins
  const [editor] = useState(
    () =>
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
            shortcuts: { toggle: { keys: "mod+alt+5" } },
          }),
          NumberedListPlugin.configure({
            shortcuts: { toggle: { keys: "mod+alt+6" } },
          }),
          ListItemPlugin,
          ListItemContentPlugin,
          TextAlignPlugin.configure({
            inject: {
              nodeProps: {
                nodeKey: "align",
                defaultNodeValue: "start",
                styleKey: "textAlign",
                validNodeValues: [
                  "start",
                  "left",
                  "center",
                  "right",
                  "end",
                  "justify",
                ],
              },
              targetPlugins: ["h1", "h2", "h3", "p"],
            },
          }),
          AutoformatPlugin.configure({
            options: {
              rules: [],
            },
          }),
        ],
        value: [{ type: "p", children: [{ text: "" }] }],
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
    } else if (template) {
      setFormData({
        ...formData, 
        title: template.title, 
        tags: template.tags, 
        content: template.content
      })
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
  }, [policy, template, users]);

  const toolbarConfig: Array<{
    key: ToolbarKey;
    title: string;
    icon: React.ReactNode;
    action: () => void;
  }> = [
    {
      key: "undo",
      title: "Undo",
      icon: <Undo2 size={16} />,
      action: () => editor.tf.undo(),
    },
    {
      key: "redo",
      title: "Redo",
      icon: <Redo2 size={16} />,
      action: () => editor.tf.redo(),
    },
    {
      key: "bold",
      title: "Bold",
      icon: <FormatBold />,
      action: () => editor.tf.bold.toggle(),
    },
    {
      key: "italic",
      title: "Italic",
      icon: <FormatItalic />,
      action: () => editor.tf.italic.toggle(),
    },
    {
      key: "underline",
      title: "Underline",
      icon: <FormatUnderlined />,
      action: () => editor.tf.underline.toggle(),
    },
    {
      key: "strike",
      title: "Strikethrough",
      icon: <Strikethrough size={16} />,
      action: () => editor.tf.strikethrough.toggle(),
    },
    {
      key: "ol",
      title: "Numbered List",
      icon: <ListOrdered size={16} />,
      action: () => editor.tf.ol.toggle(),
    },
    {
      key: "ul",
      title: "Bulleted List",
      icon: <List size={16} />,
      action: () => editor.tf.ul.toggle(),
    },
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
    {
      key: "link",
      title: "Insert Link",
      icon: <Link size={16} />,
      action: () => setOpenLink(true),
    },
    {
      key: "image",
      title: "Insert Image",
      icon: <Image size={16} />,
      action: () => setOpenImage(true),
    },
  ];

  useEffect(() => {
    if ((policy || template) && editor) {
      const api = editor.api.html;
      const content = policy?.content_html || template?.content;
      const nodes =
        typeof content === "string"
          ? api.deserialize({
              element: Object.assign(document.createElement("div"), {
                innerHTML: DOMPurify.sanitize(content, {
                  ALLOWED_TAGS: [
                    "p",
                    "br",
                    "strong",
                    "b",
                    "em",
                    "i",
                    "u",
                    "underline",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "blockquote",
                    "code",
                    "pre",
                    "ul",
                    "ol",
                    "li",
                    "a",
                    "img",
                    "span",
                    "div",
                  ],
                  ALLOWED_ATTR: [
                    "href",
                    "title",
                    "alt",
                    "src",
                    "class",
                    "id",
                    "style",
                    "target",
                    "rel",
                  ],
                  ALLOWED_URI_REGEXP:
                    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z.+\-]+(?:[^a-z.+\-:]|$))/i,
                  ADD_ATTR: ["target"],
                  FORBID_TAGS: [
                    "script",
                    "object",
                    "embed",
                    "iframe",
                    "form",
                    "input",
                    "button",
                  ],
                  FORBID_ATTR: [
                    "onerror",
                    "onload",
                    "onclick",
                    "onmouseover",
                    "onfocus",
                    "onblur",
                  ],
                }),
              }),
            })
          : content || editor.children;

      editor.tf.reset();
      editor.tf.setValue(nodes);
    }
  }, [policy, template, editor]);

  // Function to update toolbar state based on editor state
  const updateToolbarState = useCallback(() => {
    if (!editor) return;

    try {
      const selection = editor.selection;
      if (!selection) return;

      // Get current marks (bold, italic, etc.)
      const marks = editor.marks || {};

      // Get current block type
      const [block] = editor.api.block.getBlockAbove() || [];
      const blockType = block?.type || 'p';

      // Get text alignment
      const align = block?.align || 'left';

      // Update block type for dropdown
      setCurrentBlockType(blockType);

      setToolbarState({
        bold: !!marks.bold,
        italic: !!marks.italic,
        underline: !!marks.underline,
        strike: !!marks.strikethrough,
        ol: blockType === 'ol' || blockType === 'numbered_list',
        ul: blockType === 'ul' || blockType === 'bulleted_list',
        'align-left': align === 'left' || align === 'start',
        'align-center': align === 'center',
        'align-right': align === 'right' || align === 'end',
        link: !!marks.link,
        // These don't have persistent state
        undo: false,
        redo: false,
        image: false,
      });
    } catch (error) {
      // Silently handle errors during state sync
      console.debug('Error syncing toolbar state:', error);
    }
  }, [editor]);

  // Handle block type change from dropdown
  const handleBlockTypeChange = (event: any) => {
    const newType = event.target.value;
    setCurrentBlockType(newType);

    if (!editor) return;

    // Convert current block to selected type
    if (newType === 'p') {
      // Convert to paragraph (remove heading)
      editor.tf.setNodes({ type: 'p' });
    } else if (newType === 'h1') {
      editor.tf.h1.toggle();
    } else if (newType === 'h2') {
      editor.tf.h2.toggle();
    } else if (newType === 'h3') {
      editor.tf.h3.toggle();
    }

    // Update toolbar state after change
    setTimeout(() => updateToolbarState(), 0);
  };

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

      // Close modal immediately and pass success message to parent
      const successMessage = isNew
        ? "Policy created successfully!"
        : "Policy updated successfully!";

      onSaved(successMessage);
    } catch (err: any) {
      // setIsSubmitting(false);
      console.error("Full error object:", err);
      console.error("Original error:", err?.originalError);
      console.error("Original error response:", err?.originalError?.response);

      // Handle server validation errors - the CustomException is in originalError
      const errorData =
        err?.originalError?.response || err?.response?.data || err?.response;
      console.error("Error data:", errorData);

      if (errorData?.errors) {
        console.error("Processing server errors:", errorData.errors);
        const serverErrors: PolicyFormErrors = {};
        errorData.errors.forEach((error: any) => {
          console.error("Processing error:", error);
          if (error.field === "title") {
            serverErrors.title = error.message;
          } else if (error.field === "status") {
            serverErrors.status = error.message;
          } else if (error.field === "tags") {
            serverErrors.tags = error.message;
          } else if (error.field === "content_html") {
            serverErrors.content = error.message;
          } else if (error.field === "next_review_date") {
            serverErrors.nextReviewDate = error.message;
          } else if (error.field === "assigned_reviewer_ids") {
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

      <InsertImageUploaderModal
        open={openImage}
        onClose={() => setOpenImage(false)}
        onInsert={(url, alt) => insertImage(editor, url, alt)}
      />
      <Drawer
        open={true}
        onClose={(_event, reason) => {
          if (reason !== "backdropClick") {
            handleClose();
          }
        }}
        anchor="right"
        sx={{
          width: isHistorySidebarOpen ? 1236 : 900,
          "& .MuiDrawer-paper": {
            width: isHistorySidebarOpen ? 1236 : 900,
            borderRadius: 0,
            padding: "15px 20px",
            marginTop: "0",
            overflow: "hidden",
            transition: "width 300ms ease-in-out",
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
          <Stack direction="row" alignItems="center" gap={1}>
            {!isNew && policy?.id && (
              <Tooltip title="View activity history" arrow>
                <IconButton
                  onClick={() => setIsHistorySidebarOpen((prev) => !prev)}
                  size="small"
                  sx={{
                    color: isHistorySidebarOpen ? "#13715B" : "#98A2B3",
                    padding: "4px",
                    borderRadius: "4px",
                    backgroundColor: isHistorySidebarOpen ? "#E6F4F1" : "transparent",
                    "&:hover": {
                      backgroundColor: isHistorySidebarOpen ? "#D1EDE6" : "#F2F4F7",
                    },
                  }}
                >
                  <HistoryIcon size={16} />
                </IconButton>
              </Tooltip>
            )}
            <CloseGreyIcon
              size={16}
              style={{ color: "#98A2B3", cursor: "pointer" }}
              onClick={handleClose}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack
          direction="row"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Main Content */}
          <Stack spacing={2} sx={{ flex: 1, paddingBottom: "16px", minWidth: 0, overflow: "auto" }}>
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
                alignItems: "center",
              }}
            >
              {/* Block Type Dropdown */}
              <Select
                value={currentBlockType}
                onChange={handleBlockTypeChange}
                size="small"
                sx={{
                  minWidth: 120,
                  height: "32px",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                  "& .MuiSelect-select": {
                    padding: "6px 32px 6px 10px",
                  },
                  "& fieldset": {
                    borderColor: "#D0D5DD",
                  },
                  "&:hover fieldset": {
                    borderColor: "#13715B",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#13715B",
                  },
                }}
              >
                <MenuItem value="p" sx={{ fontSize: "13px" }}>Text</MenuItem>
                <MenuItem value="h1" sx={{ fontSize: "13px" }}>Header 1</MenuItem>
                <MenuItem value="h2" sx={{ fontSize: "13px" }}>Header 2</MenuItem>
                <MenuItem value="h3" sx={{ fontSize: "13px" }}>Header 3</MenuItem>
              </Select>

              {/* Toolbar */}
              {toolbarConfig.map(({ key, title, icon, action }) => (
                <Tooltip key={title} title={title}>
                  <IconButton
                    onClick={() => {
                      action?.();
                      // Update toolbar state immediately after action
                      setTimeout(() => updateToolbarState(), 0);
                    }}
                    size="small"
                    sx={{
                      padding: "6px",
                      borderRadius: "3px",
                      backgroundColor: toolbarState[key]
                        ? "#E0F7FA"
                        : "#FFFFFF",
                      border: "1px solid",
                      borderColor: toolbarState[key]
                        ? "#13715B"
                        : "transparent",
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

            <Box
              sx={{
                border: "1px solid #D0D5DD",
                borderRadius: "3px",
                transition: "border-color 150ms ease-in-out, outline 150ms ease-in-out, box-shadow 150ms ease-in-out",
                outline: "1px solid transparent",
                outlineOffset: "-1px",
                "&:hover": {
                  borderColor: "#5FA896",
                },
                "&:focus-within": {
                  borderColor: "#13715B",
                  outline: "1px solid #13715B",
                  outlineOffset: "-1px",
                  boxShadow: "0 0 0 3px rgba(19, 113, 91, 0.1)",
                },
              }}
            >
              <Plate
                editor={editor}
                onChange={({ value }) => {
                  setFormData((prev) => ({
                    ...prev,
                    content: value,
                  }));
                  // Update toolbar state when editor content changes
                  updateToolbarState();
                }}
              >
                <PlateContent
                  style={
                    {
                      height: "calc(100vh - 310px)",
                      overflowY: "auto",
                      padding: "16px",
                      border: "none",
                      borderRadius: "3px",
                      backgroundColor: "#FFFFFF",
                      fontSize: theme.typography.fontSize,
                      color: theme.palette.text.primary,
                      boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                      outline: "none",
                    } as CSSProperties
                  }
                  placeholder="Start typing..."
                />
              </Plate>
            </Box>
            {errors.content && (
              <Typography
                component="span"
                color={
                  theme.palette.status?.error?.text || theme.palette.error.main
                }
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

          {/* History Sidebar - Only shown when editing */}
          {!isNew && policy?.id && (
            <HistorySidebar
              isOpen={isHistorySidebarOpen}
              entityType="policy"
              entityId={policy.id}
              height="100%"
            />
          )}
        </Stack>

        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            right: isHistorySidebarOpen ? 356 : 20,
            left: "auto",
            width: "calc(900px - 40px)",
            pt: 2,
            pb: "16px",
            px: 2,
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 1201,
            transition: "right 300ms ease-in-out",
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
    </>
  );
};

export default PolicyDetailModal;
