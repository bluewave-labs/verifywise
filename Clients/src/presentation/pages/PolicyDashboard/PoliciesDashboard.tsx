import React, { useEffect, useState } from "react";
import PolicyTable from "../../components/PolicyTable";
import PolicyDetailModal from "../../components/PolicyDetailsModal";
import { Stack, Typography } from "@mui/material";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import CustomizableButton from "../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  deletePolicy,
  getAllPolicies,
  getAllTags,
} from "../../../application/repository/policy.repository";

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

  const fetchAll = async () => {
    const [pRes, tRes] = await Promise.all([getAllPolicies(), getAllTags()]);

    setPolicies(pRes);
    setTags(tRes);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpen = (id?: string) => {
    if (!id) {
      setSelectedPolicy(null); // Ensure selectedPolicy is null for new policy
      setShowModal(true); // Open modal
    } else {
      const p = policies.find((x) => x.id === id) || null;
      setSelectedPolicy(p);
      setShowModal(true); // Open modal with selected policy
    }
  };

  const handleClose = () => setShowModal(false);

  const handleSaved = () => {
    fetchAll();
    handleClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((policy) => policy.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Stack>
        <Typography sx={vwhomeHeading}>Policy Manager</Typography>
        <Typography sx={singleTheme.textStyles.pageDescription}>
          This table includes a list of external entities that provides
          AI-related products, services, or components. You can create and
          manage all vendors here.
        </Typography>
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        mb={8}
        mt={10}
      >
        <CustomizableButton
          variant="contained"
          text="Add new policy"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          icon={<AddCircleOutlineIcon />}
          onClick={() => {
            handleOpen();
          }}
        />
      </Stack>

      <PolicyTable
        data={policies}
        onOpen={handleOpen}
        onDelete={handleDelete} // Pass the handleDelete function here
      />

      {showModal && tags.length > 0 && (
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
