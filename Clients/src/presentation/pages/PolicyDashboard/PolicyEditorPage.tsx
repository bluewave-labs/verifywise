import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  NodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import TipTapUnderline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TipTapLink from "@tiptap/extension-link";
import TipTapImage from "@tiptap/extension-image";
import {
  Table as TipTapTable,
  TableRow as TipTapTableRow,
  TableCell as TipTapTableCell,
  TableHeader as TipTapTableHeader,
} from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  Skeleton,
  Divider,
} from "@mui/material";
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
  AlignRight,
  Link,
  Unlink,
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
  Code,
  Minus,
  Rows3,
  Columns3,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Plus,
  X,
  ToggleLeft,
  ArrowLeft,
} from "lucide-react";

import Select from "../../components/Inputs/Select";
import { CustomizableButton } from "../../components/button/customizable-button";
import { HistorySidebar } from "../../components/Common/HistorySidebar";
import { usePolicyChangeHistory } from "../../../application/hooks/usePolicyChangeHistory";
import PolicyForm from "../../components/Policies/PolicyForm";
import InsertLinkModal from "../../components/Modals/InsertLinkModal/InsertLinkModal";
import { uploadFileToManager } from "../../../application/repository/file.repository";
import {
  getPolicyById,
  getAllTags,
  createPolicy,
  updatePolicy,
} from "../../../application/repository/policy.repository";
import useUsers from "../../../application/hooks/useUsers";
import { User } from "../../../domain/types/User";
import { PolicyFormData, PolicyFormErrors } from "../../types/interfaces/i.policy";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import { store } from "../../../application/redux/store";
import policyTemplates from "../../../application/data/PolicyTemplates.json";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";

// ── Auth image node view ──────────────────────────────────────────────
const AuthImage: React.FC<NodeViewProps> = ({ node }) => {
  const src = node.attrs.src || "";
  const alt = node.attrs.alt || "";
  const isApiUrl =
    src.startsWith("/api/") || src.includes("/api/file-manager/");
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
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src, isApiUrl]);

  const displaySrc = isApiUrl ? blobUrl : src;

  return (
    <NodeViewWrapper>
      {error ? (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: "0.9rem",
            textAlign: "center",
            margin: "12px 0",
          }}
        >
          Image not found
        </div>
      ) : displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          style={{ maxWidth: "100%", borderRadius: 8, margin: "12px 0" }}
        />
      ) : (
        <div
          style={{
            background: "#f0f0f0",
            color: "#666",
            padding: "16px 24px",
            borderRadius: 6,
            textAlign: "center",
            fontSize: "0.9rem",
            margin: "12px 0",
          }}
        >
          Loading image...
        </div>
      )}
    </NodeViewWrapper>
  );
};

const AuthImageExtension = TipTapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AuthImage);
  },
});

// ── Toolbar key type ──────────────────────────────────────────────────
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
  | "table"
  | "code"
  | "hr";

const defaultToolbarState: Record<ToolbarKey, boolean> = {
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
  code: false,
  hr: false,
};

// ── Normalize legacy Slate HTML ───────────────────────────────────────
function normalizeSlateHtml(html: string): string {
  let n = html.replace(
    /<div([^>]*?)data-slate-type="(h[1-6]|p|blockquote)"([^>]*)>/gi,
    (_m, before, tag, after) => `<${tag}${before}${after}>`
  );
  n = n.replace(/<div[^>]*class="slate-editor"[^>]*>/gi, "");
  n = n.replace(
    /<span[^>]*data-slate-string="true"[^>]*>([^<]*)<\/span>/gi,
    "$1"
  );
  n = n.replace(/<span[^>]*data-slate-leaf="true"[^>]*>/gi, "");
  n = n.replace(/<span[^>]*data-slate-node="text"[^>]*>/gi, "");
  n = n.replace(/\s*data-slate-[a-z-]+="[^"]*"/gi, "");
  n = n.replace(/\s*data-block-id="[^"]*"/gi, "");
  n = n.replace(/\s*class="slate-[^"]*"/gi, "");
  n = n.replace(/\s*style="position:\s*relative\s*;?\s*"/gi, "");
  n = n.replace(/\s*style=""/gi, "");
  n = n.replace(/\s*class=""/gi, "");
  n = n.replace(/<div>\s*([^<])/gi, "<p>$1");
  n = n.replace(/<\/div>/gi, "</p>");
  n = n.replace(/<\/p>\s*<\/p>/gi, "</p>");
  return n;
}

const sanitizeOptions: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "code", "pre",
    "ul", "ol", "li",
    "a", "img", "span", "div", "mark", "s", "hr",
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
};

// ── Component ─────────────────────────────────────────────────────────
export default function PolicyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { users } = useUsers();

  const isNew = !id;
  const templateId = searchParams.get("templateId");

  // Data loading state
  const [policy, setPolicy] = useState<PolicyManagerModel | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editor state
  const [openLink, setOpenLink] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState("");
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<PolicyFormErrors>({});
  const [toolbarState, setToolbarState] = useState(defaultToolbarState);
  const [currentBlockType, setCurrentBlockType] = useState<string>("p");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editorReady, setEditorReady] = useState(false);

  const [formData, setFormData] = useState<PolicyFormData>({
    title: "",
    status: "Under Review",
    tags: [],
    nextReviewDate: "",
    assignedReviewers: [],
    content: "",
  });

  // Resolve template from query param
  const template = templateId
    ? (() => {
        const t = policyTemplates.find((p) => p.id === Number(templateId));
        return t ? { title: t.title, tags: t.tags, content: t.content } : undefined;
      })()
    : undefined;

  // Prefetch change history for existing policies
  usePolicyChangeHistory(!isNew && policy?.id ? policy.id : undefined);

  // ── Load data ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Always fetch tags
        const fetchedTags = await getAllTags();
        if (cancelled) return;
        setTags(fetchedTags);

        // Fetch policy for edit mode
        if (id) {
          const fetchedPolicy = await getPolicyById(id);
          if (cancelled) return;
          setPolicy(fetchedPolicy);
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(
            id ? "Failed to load policy. It may not exist." : "Failed to load tags."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // ── Populate form from policy/template ────────────────────────────
  useEffect(() => {
    if (policy) {
      setFormData({
        title: policy.title || "",
        status: policy.status || "Draft",
        tags: policy.tags || [],
        nextReviewDate: policy.next_review_date
          ? new Date(policy.next_review_date).toISOString().slice(0, 10)
          : "",
        assignedReviewers: policy.assigned_reviewer_ids
          ? policy.assigned_reviewer_ids
              .map((i) => users.find((u) => u.id === i))
              .filter((u): u is User => u !== undefined)
          : [],
        content: policy.content_html || "",
      });
    } else if (template) {
      setFormData((prev) => ({
        ...prev,
        title: template.title,
        tags: template.tags,
        content: template.content,
      }));
    }
  }, [policy, template, users]);

  // ── Toolbar state sync ────────────────────────────────────────────
  const updateToolbarState = useCallback(() => {
    if (!editor) return;
    try {
      let blockType = "p";
      if (editor.isActive("heading", { level: 1 })) blockType = "h1";
      else if (editor.isActive("heading", { level: 2 })) blockType = "h2";
      else if (editor.isActive("heading", { level: 3 })) blockType = "h3";
      else if (editor.isActive("blockquote")) blockType = "blockquote";

      setCurrentBlockType(blockType);
      setToolbarState({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        ol: editor.isActive("orderedList"),
        ul: editor.isActive("bulletList"),
        "align-left": editor.isActive({ textAlign: "left" }),
        "align-center": editor.isActive({ textAlign: "center" }),
        "align-right": editor.isActive({ textAlign: "right" }),
        link: editor.isActive("link"),
        highlight: editor.isActive("highlight"),
        blockquote: blockType === "blockquote",
        code: editor.isActive("codeBlock"),
        undo: false,
        redo: false,
        image: false,
        table: editor.isActive("table"),
        hr: false,
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── TipTap editor ─────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TipTapUnderline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph", "blockquote"] }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      AuthImageExtension.configure({ inline: false, allowBase64: true }),
      TipTapTable.configure({ resizable: true }),
      TipTapTableRow,
      TipTapTableCell,
      TipTapTableHeader,
      Placeholder.configure({ placeholder: "Start typing your policy content..." }),
    ],
    content: "",
    autofocus: false,
    onCreate: () => setEditorReady(true),
    onUpdate: () => {
      setFormData((prev) => ({ ...prev, content: editor?.getHTML() || "" }));
      updateToolbarState();
    },
    onSelectionUpdate: () => updateToolbarState(),
  });

  // ── Load content into editor ──────────────────────────────────────
  useEffect(() => {
    if (!editor || !editorReady) return;
    const content = policy?.content_html || template?.content;
    if (!content || typeof content !== "string") return;

    const normalized = normalizeSlateHtml(content);
    const sanitized = DOMPurify.sanitize(normalized, sanitizeOptions);
    editor.commands.setContent(sanitized);
  }, [policy, template, editor, editorReady]);

  // ── Image upload handler ──────────────────────────────────────────
  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    setIsUploadingImage(true);
    try {
      const response = await uploadFileToManager({
        file,
        model_id: null,
        source: "policy_editor",
        signal: undefined,
      });
      const fileId = response.data.id;
      editor
        ?.chain()
        .focus()
        .setImage({ src: `/api/file-manager/${fileId}`, alt: file.name })
        .run();
    } catch {
      // ignore
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ── Block type change ─────────────────────────────────────────────
  const handleBlockTypeChange = (event: {
    target: { value: string | number };
  }) => {
    const newType = String(event.target.value);
    setCurrentBlockType(newType);
    if (!editor) return;
    if (newType === "p") editor.chain().focus().setParagraph().run();
    else if (newType === "h1")
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (newType === "h2")
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (newType === "h3")
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    setTimeout(() => updateToolbarState(), 0);
  };

  // ── Toolbar config ────────────────────────────────────────────────
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
      icon: <Bold size={16} />,
      action: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      title: "Italic",
      icon: <Italic size={16} />,
      action: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      title: "Underline",
      icon: <UnderlineIcon size={16} />,
      action: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      key: "strike",
      title: "Strikethrough",
      icon: <Strikethrough size={16} />,
      action: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      key: "highlight",
      title: "Highlight",
      icon: <Highlighter size={16} />,
      action: () => editor?.chain().focus().toggleHighlight().run(),
    },
    {
      key: "code",
      title: "Code block",
      icon: <Code size={16} />,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      key: "ol",
      title: "Numbered list",
      icon: <ListOrdered size={16} />,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "ul",
      title: "Bulleted list",
      icon: <List size={16} />,
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      key: "blockquote",
      title: "Blockquote",
      icon: <Quote size={16} />,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      key: "hr",
      title: "Horizontal rule",
      icon: <Minus size={16} />,
      action: () => editor?.chain().focus().setHorizontalRule().run(),
    },
    {
      key: "align-left",
      title: "Align left",
      icon: <AlignLeft size={16} />,
      action: () => editor?.chain().focus().setTextAlign("left").run(),
    },
    {
      key: "align-center",
      title: "Align center",
      icon: <AlignCenter size={16} />,
      action: () => editor?.chain().focus().setTextAlign("center").run(),
    },
    {
      key: "align-right",
      title: "Align right",
      icon: <AlignRight size={16} />,
      action: () => editor?.chain().focus().setTextAlign("right").run(),
    },
    {
      key: "link",
      title: editor?.isActive("link") ? "Remove link" : "Insert link",
      icon: editor?.isActive("link") ? (
        <Unlink size={16} />
      ) : (
        <Link size={16} />
      ),
      action: () => {
        if (!editor) return;
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run();
          return;
        }
        const { from, to } = editor.state.selection;
        setSelectedTextForLink(
          from !== to ? editor.state.doc.textBetween(from, to) : ""
        );
        setOpenLink(true);
      },
    },
    {
      key: "image",
      title: isUploadingImage ? "Uploading..." : "Insert image",
      icon: <Image size={16} />,
      action: () => {
        if (!isUploadingImage) imageInputRef.current?.click();
      },
    },
    {
      key: "table",
      title: "Insert table",
      icon: <Table size={16} />,
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertTable({ rows: 3, cols: 4, withHeaderRow: true })
          .run(),
    },
  ];

  // ── Table context toolbar config ──────────────────────────────────
  const tableToolbarConfig: Array<{
    key: string;
    title: string;
    icon: React.ReactNode;
    action: () => void;
    separator?: boolean;
    danger?: boolean;
  }> = [
    {
      key: "addRowBefore",
      title: "Add row above",
      icon: <Plus size={14} />,
      action: () => editor?.chain().focus().addRowBefore().run(),
    },
    {
      key: "addRowAfter",
      title: "Add row below",
      icon: <Rows3 size={14} />,
      action: () => editor?.chain().focus().addRowAfter().run(),
    },
    {
      key: "deleteRow",
      title: "Delete row",
      icon: <X size={14} />,
      action: () => editor?.chain().focus().deleteRow().run(),
      separator: true,
    },
    {
      key: "addColumnBefore",
      title: "Add column left",
      icon: <Plus size={14} />,
      action: () => editor?.chain().focus().addColumnBefore().run(),
    },
    {
      key: "addColumnAfter",
      title: "Add column right",
      icon: <Columns3 size={14} />,
      action: () => editor?.chain().focus().addColumnAfter().run(),
    },
    {
      key: "deleteColumn",
      title: "Delete column",
      icon: <X size={14} />,
      action: () => editor?.chain().focus().deleteColumn().run(),
      separator: true,
    },
    {
      key: "mergeCells",
      title: "Merge cells",
      icon: <TableCellsMerge size={14} />,
      action: () => editor?.chain().focus().mergeCells().run(),
    },
    {
      key: "splitCell",
      title: "Split cell",
      icon: <TableCellsSplit size={14} />,
      action: () => editor?.chain().focus().splitCell().run(),
      separator: true,
    },
    {
      key: "toggleHeaderRow",
      title: "Toggle header row",
      icon: <ToggleLeft size={14} />,
      action: () => editor?.chain().focus().toggleHeaderRow().run(),
    },
    {
      key: "toggleHeaderColumn",
      title: "Toggle header column",
      icon: <ToggleLeft size={14} />,
      action: () => editor?.chain().focus().toggleHeaderColumn().run(),
      separator: true,
    },
    {
      key: "deleteTable",
      title: "Delete table",
      icon: <Trash2 size={14} />,
      action: () => editor?.chain().focus().deleteTable().run(),
      danger: true,
    },
  ];

  // ── Validation ────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: PolicyFormErrors = {};

    const titleCheck = checkStringValidation("Policy title", formData.title, 1, 64);
    if (!titleCheck.accepted) newErrors.title = titleCheck.message;
    if (!formData.status) newErrors.status = "Status is required";

    if (formData.tags.filter((t) => t.trim() !== "").length === 0)
      newErrors.tags = "At least one tag is required";

    const dateCheck = checkStringValidation(
      "Next review date",
      formData.nextReviewDate || "",
      1
    );
    if (!dateCheck.accepted) newErrors.nextReviewDate = dateCheck.message;

    if (formData.assignedReviewers.filter((u) => u.id !== undefined).length === 0)
      newErrors.assignedReviewers = "At least one reviewer is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────
  const save = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    const html = editor?.getHTML() || "";
    const payload = {
      title: formData.title,
      status: formData.status,
      tags: formData.tags,
      content_html: html,
      next_review_date: formData.nextReviewDate
        ? new Date(formData.nextReviewDate)
        : undefined,
      assigned_reviewer_ids: formData.assignedReviewers.map((u) => u.id),
    };

    try {
      const startTime = Date.now();

      if (isNew) {
        await createPolicy(payload);
      } else {
        await updatePolicy(policy!.id, payload);
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000)
        await new Promise((r) => setTimeout(r, 1000 - elapsed));

      setIsSaving(false);

      const message =
        isNew && template
          ? "Policy created successfully from template"
          : isNew
            ? "Policy created successfully"
            : "Policy updated successfully";

      navigate("/policies", {
        state: {
          successMessage: message,
          flashRowId: policy?.id,
        },
      });
    } catch (err: any) {
      setIsSaving(false);

      const errorData =
        err?.originalError?.response || err?.response?.data || err?.response;

      if (errorData?.errors) {
        const serverErrors: PolicyFormErrors = {};
        errorData.errors.forEach((error: any) => {
          if (error.field === "title") serverErrors.title = error.message;
          else if (error.field === "status") serverErrors.status = error.message;
          else if (error.field === "tags") serverErrors.tags = error.message;
          else if (error.field === "content_html")
            serverErrors.content = error.message;
          else if (error.field === "next_review_date")
            serverErrors.nextReviewDate = error.message;
          else if (error.field === "assigned_reviewer_ids")
            serverErrors.assignedReviewers = error.message;
        });
        setErrors(serverErrors);
      }
    }
  };

  // ── Export ─────────────────────────────────────────────────────────
  const downloadExport = async (format: "pdf" | "docx") => {
    if (!policy?.id) return;

    const setExporting =
      format === "pdf" ? setIsExportingPDF : setIsExportingDOCX;
    setExporting(true);
    setExportError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const token = store.getState().auth.authToken;
      const response = await fetch(
        `/api/policies/${policy.id}/export/${format}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Export failed (${response.status})`);

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${formData.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${format}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const finalBlob =
        format === "docx"
          ? new Blob([blob], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            })
          : blob;

      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      clearTimeout(timeout);
      setExportError(
        error.name === "AbortError"
          ? `${format.toUpperCase()} export timed out. Please try again.`
          : `Failed to export ${format.toUpperCase()}. Please try again.`
      );
    } finally {
      setExporting(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────
  if (isLoading) {
    return (
      <Stack gap={2} sx={{ p: 0 }}>
        <Skeleton variant="rectangular" height={32} width={300} />
        <Skeleton variant="rectangular" height={80} />
        <Skeleton variant="rectangular" height={40} />
        <Skeleton variant="rectangular" height={400} />
      </Stack>
    );
  }

  if (loadError) {
    return (
      <Stack gap={2} sx={{ p: 0 }}>
        <PageBreadcrumbs />
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
          }}
        >
          <Typography sx={{ color: "#344054", mb: 2 }}>{loadError}</Typography>
          <CustomizableButton
            variant="outlined"
            text="Back to policies"
            onClick={() => navigate("/policies")}
          />
        </Box>
      </Stack>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  const pageTitle = isNew
    ? template
      ? "New policy from template"
      : "New policy"
    : formData.title || "Edit policy";

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
            editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
          } else {
            const linkText = text || url;
            editor
              .chain()
              .focus()
              .insertContent({
                type: "text",
                text: linkText,
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    },
                  },
                ],
              })
              .run();
          }
        }}
        selectedText={selectedTextForLink}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      <Stack className="vwhome" gap="16px">
        {/* ── Breadcrumbs ──────────────────────────────────────────── */}
        <PageBreadcrumbs />

      <Stack
        sx={{
          height: "calc(100vh - 130px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: "8px", flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Back to policies" arrow>
              <IconButton
                onClick={() => navigate("/policies")}
                size="small"
                sx={{
                  padding: "4px",
                  borderRadius: "4px",
                  color: "#98A2B3",
                  "&:hover": { backgroundColor: "#F2F4F7", color: "#344054" },
                }}
              >
                <ArrowLeft size={18} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ fontSize: 16, color: "#344054", fontWeight: 600 }}>
              {pageTitle}
            </Typography>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
            {/* Export error */}
            {exportError && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: theme.palette.status?.error?.text || "#f04438",
                  backgroundColor: theme.palette.status?.error?.bg || "#f9eced",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "4px",
                }}
              >
                {exportError}
              </Typography>
            )}

            {/* History toggle */}
            {!isNew && policy?.id && (
              <Tooltip title="Activity history" arrow>
                <IconButton
                  onClick={() => setIsHistorySidebarOpen((prev) => !prev)}
                  size="small"
                  sx={{
                    color: isHistorySidebarOpen ? "#13715B" : "#98A2B3",
                    padding: "4px",
                    borderRadius: "4px",
                    backgroundColor: isHistorySidebarOpen
                      ? "#E6F4F1"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isHistorySidebarOpen
                        ? "#D1EDE6"
                        : "#F2F4F7",
                    },
                  }}
                >
                  <HistoryIcon size={16} />
                </IconButton>
              </Tooltip>
            )}

            {/* Export buttons */}
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
                        minWidth: "80px",
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
                      icon={
                        isExportingPDF ? (
                          <Loader2
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <FileText size={16} />
                        )
                      }
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
                        minWidth: "80px",
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
                      icon={
                        isExportingDOCX ? (
                          <Loader2
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <FileDown size={16} />
                        )
                      }
                    />
                  </span>
                </Tooltip>
              </>
            )}

            {/* Save */}
            <CustomizableButton
              variant="contained"
              text={
                isSaving
                  ? "Saving..."
                  : isNew && template
                    ? "Save in organizational policies"
                    : "Save"
              }
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
              icon={
                isSaving ? (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <SaveIcon size={16} />
                )
              }
            />
          </Stack>
        </Stack>

        {/* ── Metadata form ────────────────────────────────────────── */}
        <Box sx={{ flexShrink: 0, mb: "8px" }}>
          <PolicyForm
            formData={formData}
            setFormData={setFormData}
            tags={tags}
            errors={errors}
            setErrors={setErrors}
          />
        </Box>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            mb: 1.5,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Block type dropdown */}
          <Box sx={{ mr: 2 }}>
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
              sx={{ width: 120, height: "34px" }}
            />
          </Box>

          {toolbarConfig.map(({ key, title, icon, action }) => (
            <Tooltip key={key} title={title}>
              <IconButton
                onClick={() => {
                  action?.();
                  setTimeout(() => updateToolbarState(), 0);
                }}
                size="small"
                sx={{
                  padding: "6px",
                  borderRadius: "3px",
                  backgroundColor: toolbarState[key] ? "#E0F7FA" : "#FFFFFF",
                  border: "1px solid",
                  borderColor: toolbarState[key] ? "#13715B" : "transparent",
                  "&:hover": { backgroundColor: "#F5F5F5" },
                }}
              >
                {icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        {/* ── Editor + History sidebar ─────────────────────────────── */}
        <Stack
          direction="row"
          sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          {/* Editor */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              border: "1px solid #D0D5DD",
              borderRadius: "4px",
              transition:
                "border-color 150ms ease-in-out, outline 150ms ease-in-out, box-shadow 150ms ease-in-out",
              outline: "1px solid transparent",
              outlineOffset: "-1px",
              "&:hover": { borderColor: "#5FA896" },
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

            {/* ── Floating table toolbar ────────────────────────── */}
            {editor && (
              <BubbleMenu
                editor={editor}
                pluginKey="tableMenu"
                shouldShow={({ editor: e }) => e.isActive("table")}
                updateDelay={100}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "2px",
                    p: "4px",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    border: "1px solid #d0d5dd",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {tableToolbarConfig.map(({ key, title, icon, action, separator, danger }) => (
                    <React.Fragment key={key}>
                      <Tooltip title={title} placement="top" arrow>
                        <IconButton
                          onMouseDown={(e) => {
                            e.preventDefault();
                            action();
                          }}
                          size="small"
                          sx={{
                            padding: "5px",
                            borderRadius: "4px",
                            color: danger ? "#dc2626" : "#374151",
                            "&:hover": {
                              backgroundColor: danger ? "#fef2f2" : "#f3f4f6",
                            },
                          }}
                        >
                          {icon}
                        </IconButton>
                      </Tooltip>
                      {separator && (
                        <Divider orientation="vertical" flexItem sx={{ mx: "2px", borderColor: "#e5e7eb" }} />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              </BubbleMenu>
            )}
            <style>{`
              .policy-tiptap-editor .ProseMirror {
                height: 100%;
                min-height: 300px;
                overflow-y: auto;
                padding: 20px 24px;
                border: none;
                border-radius: 4px;
                background-color: #FFFFFF;
                font-size: ${theme.typography.fontSize}px;
                color: ${theme.palette.text.primary};
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
              .policy-tiptap-editor .ProseMirror pre {
                background-color: #1e1e1e;
                color: #d4d4d4;
                padding: 12px 16px;
                border-radius: 6px;
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 0.9em;
                overflow-x: auto;
                margin: 12px 0;
              }
              .policy-tiptap-editor .ProseMirror pre code {
                background: none;
                color: inherit;
                padding: 0;
              }
              .policy-tiptap-editor .ProseMirror code {
                background-color: #f1f3f5;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 0.9em;
              }
              .policy-tiptap-editor .ProseMirror hr {
                border: none;
                border-top: 1px solid #d0d5dd;
                margin: 16px 0;
              }
              .policy-tiptap-editor .ProseMirror table {
                border-collapse: collapse;
                width: 100%;
                margin: 12px 0;
                table-layout: fixed;
                overflow: hidden;
              }
              .policy-tiptap-editor .ProseMirror th,
              .policy-tiptap-editor .ProseMirror td {
                border: 1px solid #d0d5dd;
                padding: 8px 12px;
                text-align: left;
                vertical-align: top;
                min-width: 80px;
                position: relative;
                box-sizing: border-box;
              }
              .policy-tiptap-editor .ProseMirror th {
                background-color: #f0f4f2;
                font-weight: 600;
              }
              /* Selected cell highlight */
              .policy-tiptap-editor .ProseMirror .selectedCell {
                background-color: #e6f0ec !important;
                border-color: #13715B !important;
              }
              .policy-tiptap-editor .ProseMirror .selectedCell::after {
                content: '';
                position: absolute;
                inset: 0;
                background: rgba(19, 113, 91, 0.08);
                pointer-events: none;
              }
              /* Column resize handle */
              .policy-tiptap-editor .ProseMirror .column-resize-handle {
                position: absolute;
                right: -2px;
                top: 0;
                bottom: -2px;
                width: 4px;
                background-color: #13715B;
                cursor: col-resize;
                z-index: 10;
              }
              .policy-tiptap-editor .ProseMirror.resize-cursor {
                cursor: col-resize;
              }
              /* Subtle hover on rows (only when no cell is selected) */
              .policy-tiptap-editor .ProseMirror td:hover {
                background-color: #fafbfc;
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
              color={theme.palette.status?.error?.text || theme.palette.error.main}
              sx={{ opacity: 0.8, fontSize: 11, mt: 1 }}
            >
              {errors.content}
            </Typography>
          )}

          {/* History sidebar */}
          {!isNew && policy?.id && (
            <HistorySidebar
              isOpen={isHistorySidebarOpen}
              entityType="policy"
              entityId={policy.id}
              height="100%"
            />
          )}
        </Stack>
      </Stack>
      </Stack>
    </>
  );
}
