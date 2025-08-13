import React, { useEffect, useState } from "react";
import PolicyForm, { FormData } from "./PolicyForm";
import { Policy } from "../../pages/PolicyDashboard/PoliciesDashboard";
import SaveIcon from "@mui/icons-material/Save";
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
import { IconButton, Tooltip, Grid } from "@mui/material";
import { Drawer, Stack, Typography, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomizableButton from "../../vw-v2-components/Buttons";
import {
  createPolicy,
  updatePolicy,
} from "../../../application/repository/policy.repository";

interface Props {
  policy: Policy | null;
  tags: string[];
  onClose: () => void;
  onSaved: () => void;
}

const PolicyDetailModal: React.FC<Props> = ({
  policy,
  tags,
  onClose,
  onSaved,
}) => {
  const isNew = !policy;

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
        assignedReviewers: (policy.assigned_reviewer_ids || []).map(String),
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
  }, [policy]);

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
    const html = await serializeHtml(editor);
    const payload = {
      title: formData.title,
      status: formData.status,
      tags: formData.tags,
      content_html: html,
      next_review_date: formData.nextReviewDate
        ? new Date(formData.nextReviewDate)
        : undefined,
      assigned_reviewer_ids: formData.assignedReviewers
        .filter(Boolean)
        .map((id) => parseInt(id, 10)),
    };

    try {
      if (isNew) {
        await createPolicy(payload);
      } else {
        await updatePolicy(policy!.id, payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Drawer
      open={true}
      onClose={onClose}
      anchor="right"
      sx={{
        width: 800,
        "& .MuiDrawer-paper": {
          width: 800,
          borderRadius: 0,
          padding: "15px 20px",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          {isNew ? "New Policy" : formData.title}
        </Typography>
        <CloseIcon onClick={onClose} sx={{ cursor: "pointer" }} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <PolicyForm formData={formData} setFormData={setFormData} tags={tags} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Content</Typography>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {/* Toolbar */}
              <div>
                {[
                  {
                    title: "Bold",
                    icon: <FormatBold />,
                    action: () => editor.tf.bold.toggle(),
                  },
                  {
                    title: "Italic",
                    icon: <FormatItalic />,
                    action: () => editor.tf.italic.toggle(),
                  },
                  {
                    title: "Underline",
                    icon: <FormatUnderlined />,
                    action: () => editor.tf.underline.toggle(),
                  },
                  {
                    title: "Heading 1",
                    icon: <LooksOne />,
                    action: () => editor.tf.h1.toggle(),
                  },
                  {
                    title: "Heading 2",
                    icon: <LooksTwo />,
                    action: () => editor.tf.h2.toggle(),
                  },
                  {
                    title: "Heading 3",
                    icon: <Looks3 />,
                    action: () => editor.tf.h3.toggle(),
                  },
                  {
                    title: "Blockquote",
                    icon: <FormatQuote />,
                    action: () => editor.tf.blockquote.toggle(),
                  },
                ].map(({ title, icon, action }) => (
                  <Tooltip key={title} title={title}>
                    <IconButton
                      onClick={action}
                      disableRipple
                      // color={isActive ? "primary" : "default"}
                      size="small"
                      sx={{
                        padding: "6px",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: "#e0e0e0",
                        },
                      }}
                    >
                      {icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </div>
            </div>
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
                  minHeight: "500px",
                  padding: "16px",
                  border: "1px solid #ddd",
                }}
                placeholder="Start typing..."
              />
            </Plate>
          </Grid>
        </Grid>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack
        className="vw-iso-42001-clause-drawer-dialog-footer"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          padding: "15px 20px",
        }}
      >
        <CustomizableButton
          variant="contained"
          text="Save"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          onClick={save}
          icon={<SaveIcon />}
        />
      </Stack>
    </Drawer>
  );
};

export default PolicyDetailModal;
