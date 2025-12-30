import React, { CSSProperties, useEffect, useState, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import PolicyForm from "./PolicyForm";
import { PolicyFormErrors, PolicyDetailModalProps, PolicyFormData } from "../../types/interfaces/i.policy";
import { Plate, PlateContent, createPlateEditor } from "platejs/react";
import { AutoformatPlugin } from "@platejs/autoformat";
import { Range, Editor, BaseRange, Transforms, Path } from "slate";
import InsertLinkModal from "../Modals/InsertLinkModal/InsertLinkModal";
import { uploadFileToManager } from "../../../application/repository/file.repository";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  StrikethroughPlugin,
  BlockquotePlugin,
  HighlightPlugin,
} from "@platejs/basic-nodes/react";
import {
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  ListItemPlugin,
  ListItemContentPlugin,
} from "@platejs/list-classic/react";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { insertTable } from "@platejs/table";
import { tablePlugin, tableRowPlugin, tableCellPlugin, tableCellHeaderPlugin } from "../PlatePlugins/CustomTablePlugin";
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
  Unlink,
  AlignRight,
  Image,
  Redo2,
  Undo2,
  History as HistoryIcon,
  Quote,
  Highlighter,
  Table,
} from "lucide-react";

const FormatUnderlined = () => <Underline size={16} />;
const FormatBold = () => <Bold size={16} />;
const FormatItalic = () => <Italic size={16} />;
import { IconButton, Tooltip, useTheme, Box } from "@mui/material";
import Select from "../Inputs/Select";
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
import { linkPlugin, insertLink, removeLink, isLinkActive } from "../PlatePlugins/CustomLinkPlugin";
import { imagePlugin, insertImage } from "../PlatePlugins/CustomImagePlugin";


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
  const [selectedTextForLink, setSelectedTextForLink] = useState("");
  const [savedSelection, setSavedSelection] = useState<BaseRange | null>(null);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    | "image"
    | "highlight"
    | "blockquote"
    | "table";

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
      highlight: false,
      blockquote: false,
      table: false,
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

  // Disable ESC key closing for policy editor to prevent accidental data loss
  // Users can still close via the X button or Cancel button
  useModalKeyHandling({
    isOpen: true,
    onClose: handleClose,
    onEscapeKey: () => {
      // Do nothing on ESC - prevent accidental close with unsaved content
    },
  });

  // Handle image file selection and upload
  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = "";

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Selected file is not an image");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error("Image file is too large (max 10MB)");
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await uploadFileToManager({
        file,
        model_id: null,
        source: "policy_editor",
        signal: undefined,
      });

      const fileId = response.data.id;
      // Use relative /api path - Vite dev server proxies this to backend
      const imageUrl = `/api/file-manager/${fileId}?isFileManagerFile=true`;
      insertImage(editor, imageUrl, file.name);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

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
          HighlightPlugin,
          BlockquotePlugin,
          tablePlugin,
          tableRowPlugin,
          tableCellPlugin,
          tableCellHeaderPlugin,
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
              targetPlugins: ["h1", "h2", "h3", "p", "blockquote"],
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

  // Add error handling for editor operations to prevent crashes from invalid paths
  useEffect(() => {
    if (editor) {
      const originalApply = editor.apply;
      editor.apply = (operation: any) => {
        try {
          // Check for operations that might target invalid paths
          if (operation.path && operation.path.length === 0) {
            // Skip operations targeting root path
            console.warn("Skipping operation targeting root path:", operation.type);
            return;
          }
          originalApply(operation);
        } catch (e: any) {
          // Catch and log errors instead of crashing
          if (e.message?.includes("Cannot get the parent path of the root path")) {
            console.warn("Editor operation failed (root path error):", operation.type);
          } else {
            console.error("Editor operation failed:", e);
          }
        }
      };

      // Wrap deleteBackward to catch root path errors from list plugin
      const originalDeleteBackward = editor.deleteBackward;
      editor.deleteBackward = (unit: any) => {
        try {
          return originalDeleteBackward(unit);
        } catch (e: any) {
          if (e.message?.includes("Cannot get the parent path of the root path")) {
            console.warn("deleteBackward failed (root path error) - this is a known issue with list handling");
            return;
          }
          throw e;
        }
      };

      // Wrap deleteForward as well
      const originalDeleteForward = editor.deleteForward;
      editor.deleteForward = (unit: any) => {
        try {
          return originalDeleteForward(unit);
        } catch (e: any) {
          if (e.message?.includes("Cannot get the parent path of the root path")) {
            console.warn("deleteForward failed (root path error)");
            return;
          }
          throw e;
        }
      };
    }
  }, [editor]);

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
      title: isLinkActive(editor) ? "Remove Link" : "Insert Link",
      icon: isLinkActive(editor) ? <Unlink size={16} /> : <Link size={16} />,
      action: () => {
        // If cursor is in a link, remove the link
        if (isLinkActive(editor)) {
          removeLink(editor);
          return;
        }
        // Otherwise, open the insert link modal
        const { selection } = editor;
        if (selection && !Range.isCollapsed(selection)) {
          const selectedText = Editor.string(editor, selection);
          setSelectedTextForLink(selectedText);
          // Save the selection range so we can restore it after modal closes
          setSavedSelection(selection);
        } else {
          setSelectedTextForLink("");
          setSavedSelection(selection);
        }
        setOpenLink(true);
      },
    },
    {
      key: "image",
      title: isUploadingImage ? "Uploading..." : "Insert Image",
      icon: <Image size={16} />,
      action: () => {
        if (!isUploadingImage) {
          imageInputRef.current?.click();
        }
      },
    },
    {
      key: "highlight",
      title: "Highlight",
      icon: <Highlighter size={16} />,
      action: () => editor.tf.highlight.toggle(),
    },
    {
      key: "blockquote",
      title: "Blockquote",
      icon: <Quote size={16} />,
      action: () => editor.tf.blockquote.toggle(),
    },
    {
      key: "table",
      title: "Insert Table",
      icon: <Table size={16} />,
      action: () => {
        insertTable(editor, { colCount: 4, rowCount: 3, header: true }, { select: true });
        // Insert an empty paragraph after the table so users can continue typing below it
        const { selection } = editor;
        if (selection) {
          // Find the table node and insert paragraph after it
          const tableEntry = Editor.above(editor, {
            match: (n: any) => n.type === 'table',
          });
          if (tableEntry) {
            const [, tablePath] = tableEntry;
            const afterTablePath = Path.next(tablePath);
            Transforms.insertNodes(
              editor,
              { type: 'p', children: [{ text: '' }] } as any,
              { at: afterTablePath }
            );
          }
        }
      },
    },
  ];

  useEffect(() => {
    if ((policy || template) && editor) {
      const api = editor.api.html;
      const content = policy?.content_html || template?.content;
      // Replace img src with data-src to prevent browser from loading images during deserialization
      // The browser automatically tries to fetch <img src="..."> when setting innerHTML,
      // which fails for authenticated API URLs. Our ImageElement component handles the auth fetch.
      const processedContent = typeof content === "string"
        ? content.replace(/<img\s+([^>]*)src=/gi, "<img $1data-src=")
        : content;
      const nodes =
        typeof processedContent === "string"
          ? api.deserialize({
              element: Object.assign(document.createElement("div"), {
                innerHTML: DOMPurify.sanitize(processedContent, {
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
                    "mark",
                    "table",
                    "thead",
                    "tbody",
                    "tr",
                    "th",
                    "td",
                  ],
                  ALLOWED_ATTR: [
                    "href",
                    "title",
                    "alt",
                    "src",
                    "data-src",
                    "class",
                    "id",
                    "style",
                    "target",
                    "rel",
                    "colspan",
                    "rowspan",
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
      // Clear undo history so the initial content is the baseline
      // and undo doesn't revert to an empty editor
      if (editor.history) {
        editor.history.undos = [];
        editor.history.redos = [];
      }
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

      // Get current block type - traverse up to find a block element
      let blockType = 'p';
      let align = 'left';

      try {
        // Get the current block using editor.api.block()
        const blockEntry = editor.api.block();
        if (blockEntry && blockEntry[0]) {
          const block = blockEntry[0];
          const type = block.type as string;
          if (type === 'h1' || type === 'heading-one') {
            blockType = 'h1';
          } else if (type === 'h2' || type === 'heading-two') {
            blockType = 'h2';
          } else if (type === 'h3' || type === 'heading-three') {
            blockType = 'h3';
          } else if (type === 'blockquote') {
            blockType = 'blockquote';
          } else {
            blockType = 'p';
          }
          align = (block as any).align || 'left';
        }
      } catch {
        // Fallback to paragraph
        blockType = 'p';
      }

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
        highlight: !!marks.highlight,
        blockquote: blockType === 'blockquote',
        // These don't have persistent state
        undo: false,
        redo: false,
        image: false,
        table: false,
      });
    } catch (error) {
      // Silently handle errors during state sync
      console.debug('Error syncing toolbar state:', error);
    }
  }, [editor]);

  // Handle block type change from dropdown
  const handleBlockTypeChange = (event: { target: { value: string | number } }) => {
    const newType = String(event.target.value);
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

  // Helper to serialize image node to HTML (avoids hooks issue)
  const serializeImageToHtml = (node: any): string => {
    const url = node.url || node.src || "";
    const alt = node.alt || "";
    const width = node.width || "100%";
    const align = node.align || "center";
    const caption = node.caption || "";

    const alignItems = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    const widthStyle = typeof width === "number" ? `${width}px` : width;

    let html = `<div style="display: flex; flex-direction: column; align-items: ${alignItems}; margin: 12px 0;">`;
    html += `<img src="${url}" alt="${alt}" style="width: ${widthStyle}; max-width: 100%; border-radius: 8px;" />`;
    if (caption) {
      html += `<div style="margin-top: 8px; font-size: 0.85rem; color: #667085; font-style: italic; text-align: center;">${caption}</div>`;
    }
    html += `</div>`;
    return html;
  };

  // Helper to serialize table node to HTML (avoids hooks issue)
  const serializeTableToHtml = (node: any): string => {
    let html = '<table style="border-collapse: collapse; width: 100%; margin: 12px 0;">';

    const serializeChildren = (children: any[]): string => {
      return children.map((child: any) => {
        if (child.text !== undefined) {
          let text = child.text;
          if (child.bold) text = `<strong>${text}</strong>`;
          if (child.italic) text = `<em>${text}</em>`;
          if (child.underline) text = `<u>${text}</u>`;
          return text;
        }
        return '';
      }).join('');
    };

    if (node.children) {
      node.children.forEach((row: any) => {
        if (row.type === 'tr') {
          html += '<tr>';
          if (row.children) {
            row.children.forEach((cell: any) => {
              const isHeader = cell.type === 'th';
              const tag = isHeader ? 'th' : 'td';
              const bgStyle = isHeader ? 'background-color: #f9fafb; font-weight: 600;' : '';
              html += `<${tag} style="border: 1px solid #d0d5dd; padding: 8px 12px; text-align: left; ${bgStyle}">`;
              if (cell.children) {
                cell.children.forEach((content: any) => {
                  if (content.children) {
                    html += serializeChildren(content.children);
                  } else if (content.text !== undefined) {
                    html += content.text;
                  }
                });
              }
              html += `</${tag}>`;
            });
          }
          html += '</tr>';
        }
      });
    }

    html += '</table>';
    return html;
  };

  // Custom HTML serializer that handles images and tables without hooks
  const serializeToHtml = async (): Promise<string> => {
    // Get HTML from serializeHtml but replace image/table placeholders
    // First, temporarily remove special nodes and track their positions
    const editorValue = JSON.parse(JSON.stringify(editor.children));

    // Process nodes recursively to replace images and tables with placeholder markers
    const imageMap = new Map<string, any>();
    const tableMap = new Map<string, any>();
    let imageIndex = 0;
    let tableIndex = 0;

    const processNode = (node: any): any => {
      if (node.type === "image") {
        const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`;
        imageMap.set(placeholder, node);
        imageIndex++;
        return { type: "p", children: [{ text: placeholder }] };
      }
      if (node.type === "table") {
        const placeholder = `__TABLE_PLACEHOLDER_${tableIndex}__`;
        tableMap.set(placeholder, node);
        tableIndex++;
        return { type: "p", children: [{ text: placeholder }] };
      }
      if (node.children) {
        return { ...node, children: node.children.map(processNode) };
      }
      return node;
    };

    const processedValue = editorValue.map(processNode);

    // Temporarily set processed value and clear selection to avoid path errors
    const originalValue = editor.children;
    const originalSelection = editor.selection;
    editor.children = processedValue;
    editor.selection = null;

    let html = await serializeHtml(editor);

    // Restore original value and selection
    editor.children = originalValue;
    editor.selection = originalSelection;

    // Replace placeholders with actual HTML
    imageMap.forEach((imageNode, placeholder) => {
      html = html.replace(placeholder, serializeImageToHtml(imageNode));
    });
    tableMap.forEach((tableNode, placeholder) => {
      html = html.replace(placeholder, serializeTableToHtml(tableNode));
    });

    return html;
  };

  const save = async () => {
    if (!validateForm()) {
      return;
    }
    // setIsSubmitting(true);
    const html = await serializeToHtml();
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
        onClose={() => {
          setOpenLink(false);
          setSelectedTextForLink("");
          setSavedSelection(null);
        }}
        onInsert={(url, text) => {
          // Restore the saved selection before inserting the link
          if (savedSelection) {
            editor.select(savedSelection);
          }
          insertLink(editor, url, text);
          setSavedSelection(null);
        }}
        selectedText={selectedTextForLink}
      />

      {/* Hidden file input for native OS file picker */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />
      <Drawer
        open={true}
        onClose={(_event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleClose();
          }
        }}
        anchor="right"
        disableEscapeKeyDown
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
              {isNew ? (template ? "Create new policy from the template" : "Create new policy") : formData.title}
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
              <Box sx={{ marginRight: "8px" }}>
                <Select
                  id="block-type-select"
                  value={currentBlockType}
                  onChange={handleBlockTypeChange}
                  items={[
                    { _id: "p", name: "Text" },
                    { _id: "h1", name: "Header 1" },
                    { _id: "h2", name: "Header 2" },
                    { _id: "h3", name: "Header 3" },
                  ]}
                  sx={{
                    width: 120,
                    height: "34px",
                  }}
                />
              </Box>

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
                onSelectionChange={() => {
                  // Update toolbar state when selection/cursor changes
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
                      "--plate-highlight-bg": "#fef08a",
                      "--plate-blockquote-border": "#d0d5dd",
                    } as CSSProperties
                  }
                  placeholder="Start typing..."
                />
                <style>{`
                  [data-slate-editor] mark {
                    background-color: #fef08a;
                    padding: 0 2px;
                    border-radius: 2px;
                  }
                  [data-slate-editor] blockquote {
                    border-left: 3px solid #d0d5dd;
                    margin: 8px 0;
                    padding: 8px 16px;
                    color: #475467;
                    background-color: #f9fafb;
                    border-radius: 0 4px 4px 0;
                  }
                  [data-slate-editor] table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 12px 0;
                  }
                  [data-slate-editor] th,
                  [data-slate-editor] td {
                    border: 1px solid #d0d5dd;
                    padding: 8px 12px;
                    text-align: left;
                  }
                  [data-slate-editor] th {
                    background-color: #f9fafb;
                    font-weight: 600;
                  }
                  [data-slate-editor] tr:hover td {
                    background-color: #f9fafb;
                  }
                `}</style>
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
            text={isNew && template ? "Save in organizational policies" : "Save"}
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
