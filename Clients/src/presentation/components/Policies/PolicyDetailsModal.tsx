import React, { useEffect, useState, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import PolicyForm from "./PolicyForm";
import { PolicyFormErrors, PolicyDetailModalProps, PolicyFormData } from "../../types/interfaces/i.policy";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TipTapLink from "@tiptap/extension-link";
import TipTapImage from "@tiptap/extension-image";
import { Table as TipTapTable, TableRow as TipTapTableRow, TableCell as TipTapTableCell, TableHeader as TipTapTableHeader } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import InsertLinkModal from "../Modals/InsertLinkModal/InsertLinkModal";
import { uploadFileToManager } from "../../../application/repository/file.repository";

// Custom image node view that fetches API images with auth headers
const AuthImage: React.FC<NodeViewProps> = ({ node }) => {
  const src = node.attrs.src || "";
  const alt = node.attrs.alt || "";
  const isApiUrl = src.startsWith("/api/") || src.includes("/api/file-manager/");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isApiUrl || !src) return;
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const token = store.getState().auth.authToken;
        const res = await fetch(src, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch (e: any) {
        if (e.name !== "AbortError" && !cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [src, isApiUrl]);

  const displaySrc = isApiUrl ? blobUrl : src;

  return (
    <NodeViewWrapper>
      {error ? (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 6, fontSize: "0.9rem", textAlign: "center", margin: "12px 0" }}>
          Image not found
        </div>
      ) : displaySrc ? (
        <img src={displaySrc} alt={alt} style={{ maxWidth: "100%", borderRadius: 8, margin: "12px 0" }} />
      ) : (
        <div style={{ background: "#f0f0f0", color: "#666", padding: "16px 24px", borderRadius: 6, textAlign: "center", fontSize: "0.9rem", margin: "12px 0" }}>
          Loading image...
        </div>
      )}
    </NodeViewWrapper>
  );
};

// Extend TipTap's Image extension with the auth-aware node view
const AuthImageExtension = TipTapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AuthImage);
  },
});

import {
  Underline as UnderlineIcon,
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
  FileText,
  FileDown,
  Loader2,
} from "lucide-react";

const FormatUnderlined = () => <UnderlineIcon size={16} />;
const FormatBold = () => <Bold size={16} />;
const FormatItalic = () => <Italic size={16} />;
import { IconButton, Tooltip, useTheme, Box } from "@mui/material";
import Select from "../Inputs/Select";
import { Drawer, Stack, Typography, Divider } from "@mui/material";
import { X as CloseGreyIcon } from "lucide-react";
import { CustomizableButton } from "../button/customizable-button";
import { HistorySidebar } from "../Common/HistorySidebar";
import { usePolicyChangeHistory } from "../../../application/hooks/usePolicyChangeHistory";
import {
  createPolicy,
  updatePolicy,
} from "../../../application/repository/policy.repository";
import useUsers from "../../../application/hooks/useUsers";
import { User } from "../../../domain/types/User";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import { useModalKeyHandling } from "../../../application/hooks/useModalKeyHandling";
import { store } from "../../../application/redux/store";

const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policy,
  tags,
  template,
  onClose,
  onSaved: _onSaved,
}) => {
  const isNew = !policy;
  const { users } = useUsers();
  const theme = useTheme();
  const [errors, setErrors] = useState<PolicyFormErrors>({});
  const [openLink, setOpenLink] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState("");
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Prefetch history data when drawer opens in edit mode
  usePolicyChangeHistory(!isNew && policy?.id ? policy.id : undefined);

  const [isSaving, setIsSaving] = useState(false);

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
      const imageUrl = `/api/file-manager/${fileId}`;
      editor?.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
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

  // Function to update toolbar state based on editor state
  const updateToolbarState = useCallback(() => {
    if (!editor) return;

    try {
      // Detect current block type
      let blockType = 'p';
      if (editor.isActive('heading', { level: 1 })) blockType = 'h1';
      else if (editor.isActive('heading', { level: 2 })) blockType = 'h2';
      else if (editor.isActive('heading', { level: 3 })) blockType = 'h3';
      else if (editor.isActive('blockquote')) blockType = 'blockquote';

      setCurrentBlockType(blockType);

      setToolbarState({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        ol: editor.isActive('orderedList'),
        ul: editor.isActive('bulletList'),
        'align-left': editor.isActive({ textAlign: 'left' }),
        'align-center': editor.isActive({ textAlign: 'center' }),
        'align-right': editor.isActive({ textAlign: 'right' }),
        link: editor.isActive('link'),
        highlight: editor.isActive('highlight'),
        blockquote: blockType === 'blockquote',
        // These don't have persistent state
        undo: false,
        redo: false,
        image: false,
        table: false,
      });
    } catch (error) {
      console.debug('Error syncing toolbar state:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable default strike to use our custom mark name mapping
      }),
      Underline,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
      }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      AuthImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      TipTapTable.configure({
        resizable: false,
      }),
      TipTapTableRow,
      TipTapTableCell,
      TipTapTableHeader,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: '',
    autofocus: false,
    onUpdate: () => {
      setFormData((prev) => ({
        ...prev,
        content: editor?.getHTML() || "",
      }));
      updateToolbarState();
    },
    onSelectionUpdate: () => {
      updateToolbarState();
    },
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
    } else if (template) {
      setFormData((prev) => ({
        ...prev,
        title: template.title,
        tags: template.tags,
        content: template.content
      }));
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

  // Normalize Slate-specific HTML to standard HTML tags for backward compatibility
  // with content saved by the previous Plate/Slate editor
  const normalizeSlateHtml = (html: string): string => {
    // Convert <div data-slate-type="p"> to <p>
    let normalized = html.replace(/<div([^>]*?)data-slate-type="(h[1-6]|p|blockquote)"([^>]*)>/gi,
      (_match, before, tag, after) => `<${tag}${before}${after}>`
    );

    // Fix corresponding closing tags: </div> → </h1>, </p>, etc.
    // Use a simple approach: parse and replace the Slate wrapper structure
    normalized = normalized.replace(/<div[^>]*class="slate-editor"[^>]*>/gi, '');

    // Remove Slate wrapper spans
    normalized = normalized.replace(/<span[^>]*data-slate-string="true"[^>]*>([^<]*)<\/span>/gi, '$1');
    normalized = normalized.replace(/<span[^>]*data-slate-leaf="true"[^>]*>/gi, '');
    normalized = normalized.replace(/<span[^>]*data-slate-node="text"[^>]*>/gi, '');

    // Remove data-slate-* and data-block-id attributes from remaining tags
    normalized = normalized.replace(/\s*data-slate-[a-z-]+="[^"]*"/gi, '');
    normalized = normalized.replace(/\s*data-block-id="[^"]*"/gi, '');

    // Remove slate-specific class names
    normalized = normalized.replace(/\s*class="slate-[^"]*"/gi, '');

    // Remove inline position:relative style that Slate adds
    normalized = normalized.replace(/\s*style="position:\s*relative\s*;?\s*"/gi, '');

    // Clean up empty style/class attributes
    normalized = normalized.replace(/\s*style=""/gi, '');
    normalized = normalized.replace(/\s*class=""/gi, '');

    // Convert remaining Slate divs (paragraph wrappers) to <p> tags
    // After removing data-slate-type, some divs may remain as paragraph containers
    normalized = normalized.replace(/<div>\s*([^<])/gi, '<p>$1');
    normalized = normalized.replace(/<\/div>/gi, '</p>');

    // Clean up any double-closed paragraph tags
    normalized = normalized.replace(/<\/p>\s*<\/p>/gi, '</p>');

    return normalized;
  };

  // Load content into editor when formData or editor becomes available
  useEffect(() => {
    if (!editor) return;

    const content = policy?.content_html || template?.content;
    if (!content || typeof content !== "string") return;

    // Normalize Slate-specific HTML before loading
    const normalized = normalizeSlateHtml(content);

    // Sanitize the HTML before loading
    const sanitized = DOMPurify.sanitize(normalized, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "code", "pre",
        "ul", "ol", "li",
        "a", "img", "span", "div", "mark", "s",
        "table", "thead", "tbody", "tr", "th", "td",
      ],
      ALLOWED_ATTR: [
        "href", "title", "alt", "src",
        "class", "id", "style",
        "target", "rel",
        "colspan", "rowspan",
      ],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z.+\-]+(?:[^a-z.+\-:]|$))/i,
      ADD_ATTR: ["target"],
      FORBID_TAGS: ["script", "object", "embed", "iframe", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    });

    editor.commands.setContent(sanitized);
  }, [policy, template, editor]);

  // Handle block type change from dropdown
  const handleBlockTypeChange = (event: { target: { value: string | number } }) => {
    const newType = String(event.target.value);
    setCurrentBlockType(newType);

    if (!editor) return;

    if (newType === 'p') {
      editor.chain().focus().setParagraph().run();
    } else if (newType === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (newType === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (newType === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }

    setTimeout(() => updateToolbarState(), 0);
  };

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
      action: () => editor?.chain().focus().undo().run(),
    },
    {
      key: "redo",
      title: "Redo",
      icon: <Redo2 size={16} />,
      action: () => editor?.chain().focus().redo().run(),
    },
    {
      key: "bold",
      title: "Bold",
      icon: <FormatBold />,
      action: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      title: "Italic",
      icon: <FormatItalic />,
      action: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      title: "Underline",
      icon: <FormatUnderlined />,
      action: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      key: "strike",
      title: "Strikethrough",
      icon: <Strikethrough size={16} />,
      action: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      key: "ol",
      title: "Numbered List",
      icon: <ListOrdered size={16} />,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "ul",
      title: "Bulleted List",
      icon: <List size={16} />,
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      key: "align-left",
      title: "Align Left",
      icon: <AlignLeft size={16} />,
      action: () => editor?.chain().focus().setTextAlign('left').run(),
    },
    {
      key: "align-center",
      title: "Align Center",
      icon: <AlignCenter size={16} />,
      action: () => editor?.chain().focus().setTextAlign('center').run(),
    },
    {
      key: "align-right",
      title: "Align Right",
      icon: <AlignRight size={16} />,
      action: () => editor?.chain().focus().setTextAlign('right').run(),
    },
    {
      key: "link",
      title: editor?.isActive('link') ? "Remove Link" : "Insert Link",
      icon: editor?.isActive('link') ? <Unlink size={16} /> : <Link size={16} />,
      action: () => {
        if (!editor) return;
        // If cursor is in a link, remove the link
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run();
          return;
        }
        // Otherwise, open the insert link modal
        const { from, to } = editor.state.selection;
        if (from !== to) {
          const selectedText = editor.state.doc.textBetween(from, to);
          setSelectedTextForLink(selectedText);
        } else {
          setSelectedTextForLink("");
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
      action: () => editor?.chain().focus().toggleHighlight().run(),
    },
    {
      key: "blockquote",
      title: "Blockquote",
      icon: <Quote size={16} />,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      key: "table",
      title: "Insert Table",
      icon: <Table size={16} />,
      action: () => {
        editor?.chain().focus()
          .insertTable({ rows: 3, cols: 4, withHeaderRow: true })
          .run();
      },
    },
  ];

  const save = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    const html = editor?.getHTML() || "";
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
      const startTime = Date.now();

      if (isNew) {
        await createPolicy(payload);
      } else {
        await updatePolicy(policy!.id, payload);
      }

      // Ensure saving state is visible for at least 1 second
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      setIsSaving(false);

      // Close modal and notify parent to refresh the table
      if (isNew && template) {
        _onSaved("Policy created successfully from template");
      } else if (isNew) {
        _onSaved("Policy created successfully");
      } else {
        _onSaved("Policy updated successfully");
      }
    } catch (err: any) {
      setIsSaving(false);
      console.error("Full error object:", err);
      console.error("Original error:", err?.originalError);
      console.error("Original error response:", err?.originalError?.response);

      // Handle server validation errors
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

  // Helper to download a file from a fetch response
  const downloadExport = async (format: "pdf" | "docx") => {
    if (!policy?.id) return;

    const setExporting = format === "pdf" ? setIsExportingPDF : setIsExportingDOCX;
    setExporting(true);
    setExportError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const token = store.getState().auth.authToken;
      const response = await fetch(`/api/policies/${policy.id}/export/${format}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${formData.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${format}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const finalBlob = format === "docx"
        ? new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
        : blob;

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      clearTimeout(timeout);
      const message = error.name === "AbortError"
        ? `${format.toUpperCase()} export timed out. Please try again.`
        : `Failed to export ${format.toUpperCase()}. Please try again.`;
      setExportError(message);
      console.error(`Failed to export ${format}:`, error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <InsertLinkModal
        open={openLink}
        onClose={() => {
          setOpenLink(false);
          setSelectedTextForLink("");
        }}
        onInsert={(url, text) => {
          if (!editor) return;
          const { from, to } = editor.state.selection;
          if (from !== to && !text) {
            // Text is selected — wrap it with the link
            editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
          } else {
            // No selection or custom text — insert new link node
            const linkText = text || url;
            editor.chain().focus()
              .insertContent({
                type: 'text',
                text: linkText,
                marks: [{ type: 'link', attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } }],
              })
              .run();
          }
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
                flexWrap: "wrap",
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
              <EditorContent
                editor={editor}
                className="policy-tiptap-editor"
              />
              <style>{`
                .policy-tiptap-editor .ProseMirror {
                  height: calc(100vh - 310px);
                  overflow-y: auto;
                  padding: 16px;
                  border: none;
                  border-radius: 3px;
                  background-color: #FFFFFF;
                  font-size: ${theme.typography.fontSize}px;
                  color: ${theme.palette.text.primary};
                  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
                  outline: none;
                }
                .policy-tiptap-editor .ProseMirror:focus {
                  outline: none;
                }
                .policy-tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  float: left;
                  color: #adb5bd;
                  pointer-events: none;
                  height: 0;
                }
                .policy-tiptap-editor .ProseMirror mark {
                  background-color: #fef08a;
                  padding: 0 2px;
                  border-radius: 2px;
                }
                .policy-tiptap-editor .ProseMirror blockquote {
                  border-left: 3px solid #d0d5dd;
                  margin: 8px 0;
                  padding: 8px 16px;
                  color: #475467;
                  background-color: #f9fafb;
                  border-radius: 0 4px 4px 0;
                }
                .policy-tiptap-editor .ProseMirror table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 12px 0;
                  table-layout: fixed;
                }
                .policy-tiptap-editor .ProseMirror th,
                .policy-tiptap-editor .ProseMirror td {
                  border: 1px solid #d0d5dd;
                  padding: 8px 12px;
                  text-align: left;
                  vertical-align: top;
                  min-width: 80px;
                }
                .policy-tiptap-editor .ProseMirror th {
                  background-color: #f9fafb;
                  font-weight: 600;
                }
                .policy-tiptap-editor .ProseMirror tr:hover td {
                  background-color: #f9fafb;
                }
                .policy-tiptap-editor .ProseMirror img {
                  max-width: 100%;
                  border-radius: 8px;
                  margin: 12px 0;
                }
                .policy-tiptap-editor .ProseMirror a {
                  color: #3182ce;
                  text-decoration: underline;
                  cursor: pointer;
                }
                .policy-tiptap-editor .ProseMirror ul,
                .policy-tiptap-editor .ProseMirror ol {
                  padding-left: 24px;
                }
                .policy-tiptap-editor .ProseMirror h1 {
                  font-size: 1.75em;
                  font-weight: 700;
                  margin: 16px 0 8px;
                }
                .policy-tiptap-editor .ProseMirror h2 {
                  font-size: 1.4em;
                  font-weight: 600;
                  margin: 12px 0 6px;
                }
                .policy-tiptap-editor .ProseMirror h3 {
                  font-size: 1.15em;
                  font-weight: 600;
                  margin: 10px 0 4px;
                }
              `}</style>
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
            gap: "8px",
            zIndex: 1201,
            transition: "right 300ms ease-in-out",
          }}
        >
          {/* Export error banner */}
          {exportError && (
            <Typography
              sx={{
                fontSize: 12,
                color: theme.palette.status?.error?.text || "#f04438",
                backgroundColor: theme.palette.status?.error?.bg || "#f9eced",
                px: 1.5,
                py: 0.75,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {exportError}
            </Typography>
          )}
          {/* Export buttons - only show when editing existing policy */}
          {!isNew && policy?.id && (
            <>
              <Tooltip title="Download as PDF" arrow>
                <span>
                  <CustomizableButton
                    variant="outlined"
                    text={isExportingPDF ? "Exporting..." : "PDF"}
                    isDisabled={isExportingPDF || isExportingDOCX}
                    sx={{
                      backgroundColor: "#fff",
                      border: "1px solid #D0D5DD",
                      color: "#344054",
                      gap: 1,
                      minWidth: "90px",
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                        borderColor: "#98A2B3",
                      },
                      "&:disabled": {
                        backgroundColor: "#F9FAFB",
                        borderColor: "#E4E7EC",
                        color: "#98A2B3",
                      },
                    }}
                    onClick={() => downloadExport("pdf")}
                    icon={isExportingPDF ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={16} />}
                  />
                </span>
              </Tooltip>
              <Tooltip title="Download as Word" arrow>
                <span>
                  <CustomizableButton
                    variant="outlined"
                    text={isExportingDOCX ? "Exporting..." : "Word"}
                    isDisabled={isExportingPDF || isExportingDOCX}
                    sx={{
                      backgroundColor: "#fff",
                      border: "1px solid #D0D5DD",
                      color: "#344054",
                      gap: 1,
                      minWidth: "90px",
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                        borderColor: "#98A2B3",
                      },
                      "&:disabled": {
                        backgroundColor: "#F9FAFB",
                        borderColor: "#E4E7EC",
                        color: "#98A2B3",
                      },
                    }}
                    onClick={() => downloadExport("docx")}
                    icon={isExportingDOCX ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <FileDown size={16} />}
                  />
                </span>
              </Tooltip>
            </>
          )}
          <CustomizableButton
            variant="contained"
            text={isSaving ? "Saving..." : (isNew && template ? "Save in organizational policies" : "Save")}
            isDisabled={isSaving}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
              "&:hover": {
                backgroundColor: "#0F5B4D",
                borderColor: "#0F5B4D",
              },
              "&:disabled": {
                backgroundColor: "#13715B",
                opacity: 0.7,
              },
            }}
            onClick={save}
            icon={isSaving ? <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> : <SaveIcon size={16} />}
          />
        </Box>
      </Drawer>
    </>
  );
};

export default PolicyDetailModal;
