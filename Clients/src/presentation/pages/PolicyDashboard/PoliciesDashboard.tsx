import React, { useEffect, useState } from "react";
import PolicyTable from "../../components/Policies/PolicyTable";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import { Stack, Typography } from "@mui/material";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import CustomizableButton from "../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import {
  deletePolicy,
  getAllPolicies,
  getAllTags,
} from "../../../application/repository/policy.repository";
import { Policy } from "../../../domain/types/Policy";

const PolicyDashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

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
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent="<h3>Policy Manager</h3><p>Policy Manager lets you create and update company AI policies in one place to stay compliant and consistent.</p><h3>Features</h3><ul><li>Create new AI policies</li><li>Edit existing policies</li><li>Organize policies with tags</li><li>Maintain compliance standards</li></ul>"
        pageTitle="Policy Manager"
      />
      <Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={vwhomeHeading}>Policy Manager</Typography>
          <HelperIcon 
            onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
            size="small"
          />
        </Stack>
        <Typography sx={singleTheme.textStyles.pageDescription}>
          Policy Manager lets you create and update company AI policies in one place to stay compliant and consistent.
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
