// PolicyDetailModal.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PolicyForm, { FormData } from './PolicyForm';
import { Policy } from '../pages/PolicyDashboard/PoliciesDashboard';
import { getAuthToken } from '../../application/redux/getAuthToken';

import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';

import { serializeHtml } from 'platejs';
import { HtmlPlugin } from 'platejs';

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
    title: '',
    status: 'Draft',
    tags: [],
    nextReviewDate: '',
    assignedReviewers: [],
    content: '',
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        title: policy.title,
        status: policy.status,
        tags: policy.tags || [],
        nextReviewDate: policy.next_review_date
          ? new Date(policy.next_review_date).toISOString().slice(0, 10)
          : '',
        assignedReviewers: (policy.assigned_reviewer_ids || []).map(String),
        content: policy.content_html || '',
      });
    } else {
      setFormData({
        title: '',
        status: 'Draft',
        tags: [],
        nextReviewDate: '',
        assignedReviewers: [],
        content: '',
      });
    }
  }, [policy]);

  // Initialize Plate editor once, with content from formData
  const editor = usePlateEditor({
    plugins: [
      HtmlPlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      BlockquotePlugin,
    ],
    value: formData.content || '<p></p>',
  }) as any;

  // Keep editor content in sync if formData.content changes (e.g. when loading a policy)
useEffect(() => {
  if (policy && editor) {
    const api = editor.api.html;
    const nodes =
      typeof policy.content_html === 'string'
        ? api.deserialize({ element: Object.assign(document.createElement('div'), { innerHTML: policy.content_html }) })
        : (policy.content_html || editor.children);

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
      const baseURL = 'http://localhost:3000';
      const token = getAuthToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (isNew) {
        await axios.post(`${baseURL}/api/policies`, payload, config);
      } else {
        await axios.put(`${baseURL}/api/policies/${policy!.id}`, payload, config);
      }

      onSaved();
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{isNew ? 'New Policy' : formData.title}</h2>

        <PolicyForm
          formData={formData}
          setFormData={setFormData}
          tags={tags}
        />

<Plate editor={editor}
       onChange={({ value }) => setFormData(prev => ({
         ...prev,
         content: value
       }))}>
  <PlateContent         style={{
          minHeight: '200px',
          padding: '16px',
          border: '1px solid #ddd',
        }} placeholder="Start typing…" />
</Plate>

        <button onClick={save}>{isNew ? 'Create' : 'Save'}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PolicyDetailModal;
