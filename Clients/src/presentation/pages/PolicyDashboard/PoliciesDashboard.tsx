import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PolicyTable from '../../components/PolicyTable';
import PolicyDetailModal from '../../components/PolicyDetailsModal';
import { getAuthToken } from '../../../application/redux/getAuthToken';

export interface Policy {
  id: string;
  title: string;
  content_html: string;
  status: string;
  tags?: string[];
  next_review_date?: string; // ISO string representation
  author_id: number;
  assigned_reviewer_ids?: number[];
  last_updated_by: number;
  last_updated_at?: string; // ISO string
}

const PolicyDashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showModal, setShowModal] = useState(false);

  const authToken = getAuthToken()

const fetchAll = async () => {
  const baseURL = 'http://localhost:3000'; // API server
  const token = authToken; // Replace this with how you retrieve your token

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const [pRes, tRes] = await Promise.all([
    axios.get<Policy[]>(`${baseURL}/api/policies`, config),
    axios.get<{ tags: string[] }>(`${baseURL}/api/policies/tags`, config)
  ]);

  console.log("policies", pRes.data);
  setPolicies(pRes.data);
  console.log("tags", tRes.data?.tags);
  setTags(tRes.data.tags);
};

  useEffect(() => {
    fetchAll();
  }, []);

const handleOpen = (id?: string) => {
  if (!id) {
    setSelectedPolicy(null); // Ensure selectedPolicy is null for new policy
    setShowModal(true); // Open modal
  } else {
    const p = policies.find(x => x.id === id) || null;
    setSelectedPolicy(p);
    setShowModal(true); // Open modal with selected policy
  }
};


  const handleClose = () => setShowModal(false);

  const handleSaved = () => {
    fetchAll();
    handleClose();
  };

  console.log("tags", tags);

  return (
    <div>
      <h1>Policy Manager</h1>
      <button onClick={() => handleOpen()}>+ New Policy</button>
      <PolicyTable data={policies} onOpen={handleOpen} />
      {showModal && tags.length > 0 &&  (
        <PolicyDetailModal
          policy={selectedPolicy}
          tags={tags}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default PolicyDashboard;
