import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PolicyForm, { FormData } from './PolicyForm';
import { Policy } from '../pages/PolicyDashboard/PoliciesDashboard';
import { getAuthToken } from '../../application/redux/getAuthToken';
import { usePlateEditor } from 'platejs/react';

interface Props {
  policy: Policy | null;
  tags: string[];
  onClose: () => void;
  onSaved: () => void;
}

const PolicyDetailModal: React.FC<Props> = ({ policy, tags, onClose, onSaved }) => {
  const isNew = !policy;

  const editor = usePlateEditor() as any;

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
    // If there's a policy, set the form data to the policy's values
    setFormData({
      title: policy.title,
      status: policy.status,
      tags: policy.tags || [],
      nextReviewDate: policy.next_review_date
        ? new Date(policy.next_review_date).toISOString().slice(0, 10)
        : '',
      assignedReviewers: (policy.assigned_reviewer_ids || []).map(String),
      content: policy.content_html, // Use policy content for editing
    });
  } else {
    // Reset content for new policy
    setFormData({
      title: '',
      status: 'Draft',
      tags: [],
      nextReviewDate: '',
      assignedReviewers: [],
      content: '', // Reset content
    });
  }
}, [policy]); // This hook will re-run whenever the policy is changed


  const save = async () => {
    const serializedContent = editor.api.html.serialize(editor.getValue());

    const payload = {
      title: formData.title,
      status: formData.status,
      tags: formData.tags,
      content_html: serializedContent,
      next_review_date: formData.nextReviewDate
        ? new Date(formData.nextReviewDate)
        : undefined,
      assigned_reviewer_ids: formData.assignedReviewers
        .filter(Boolean)
        .map(id => parseInt(id, 10)),
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
        {isNew ? (
          <h2>New Policy</h2>
        ) : (
          <h2>{formData.title}</h2>
        )}
        <PolicyForm formData={formData} setFormData={setFormData} tags={tags} />
        <button onClick={save}>{isNew ? 'Create' : 'Save'}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PolicyDetailModal;
