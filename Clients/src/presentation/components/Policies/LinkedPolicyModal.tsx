/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { Box, Stack} from "@mui/material";
import { TabContext } from "@mui/lab";
import StandardModal from "../Modals/StandardModal";
import TabBar from "../TabBar";
import { getAllEntities } from "../../../application/repository/entity.repository";
import { addNewModelButtonStyle } from "../../../presentation/pages/ModelInventory/style";
import CustomizableButton from "../Button/CustomizableButton";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import LinkedObjectsTable from "./LinkedPoliciesTable";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { RiskModel } from "../../../domain/models/Common/risks/risk.model";
import { handleAlert } from "../../../application/tools/alertUtils";

interface LinkedPolicyModalProps {
    onClose: () => void;
    policyId: number | null;
    isOpen: boolean;
}

const LinkedPolicyModal: React.FC<LinkedPolicyModalProps> = ({
    onClose,
    policyId,
    isOpen,
}) => {
    const [activeTab, setActiveTab] = useState("controls");

    const [controls, setControls] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [evidence, setEvidence] = useState<any[]>([]);

    const [, setProjectRisks] = useState<RiskModel[]>([]);

    const [, setAlert] = useState<{
        variant: "success" | "info" | "warning" | "error";
        title?: string;
        body: string;
      } | null>(null);

    // ------------------------------------
    // FETCH EXISTING LINKS
    // ------------------------------------
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            const res = await getAllEntities({
                routeUrl: `/policy-linked/${policyId}/linked-objects`,
            });

            const data = res.data;

            setControls(data.controls || []);
            setRisks(data.risks || []);
            setEvidence(data.evidence || []);
        };

        fetchData();
    }, [isOpen, policyId]);

    const fetchProjectRisks = useCallback(async (filter: 'active' | 'deleted' | 'all' = 'active') => {
        try {
          const response = await getAllProjectRisks({ filter });

          console.log("response", response.data)
          setProjectRisks(response.data);
        } catch (error) {
          console.error("Error fetching project risks:", error);
          handleToast(
            "error",
            "Unexpected error occurs while fetching project risks."
          );
        }
      }, []);

      const handleToast = (type: "success" | "info" | "warning" | "error", message: string) => {
        handleAlert({
          variant: type,
          body: message,
          setAlert,
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
      };

      useEffect(() => {
        fetchProjectRisks();
      }, [fetchProjectRisks]);

    // ------------------------------------
    // REMOVE LINK
    // ------------------------------------
    const handleRemove = async (type: string, id: number) => {
        await fetch(`/api/policies/${policyId}/linked-objects`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ object_type: type, object_id: id }),
        });

        if (type === "control")
            setControls((prev) => prev.filter((i) => i.id !== id));
        if (type === "risk")
            setRisks((prev) => prev.filter((i) => i.id !== id));
        if (type === "evidence")
            setEvidence((prev) => prev.filter((i) => i.id !== id));
    };

    // ------------------------------------
    // RENDER LIST + ADD BUTTON
    // ------------------------------------
    const renderSection = (
        items: any[],
        type: "control" | "risk" | "evidence",
        label: string
      ) => (
        <Box
          onWheel={(e) => e.stopPropagation()}
          sx={{ height: "100%", overflow: "auto" }}
        >
          <Stack spacing={3}>
            
            {/* ---------- ADD BUTTON ---------- */}
            <Box display="flex" justifyContent="flex-end">
              <CustomizableButton
                variant="contained"
                sx={addNewModelButtonStyle}
                text={`Link new ${label.toLowerCase()}`}
                icon={<AddCircleOutlineIcon size={16} />}
                // onClick={() => openSelector(type)}
              />
            </Box>
      
            {/* ---------- TABLE LIST ---------- */}
            <LinkedObjectsTable
              type={type}
              items={items}
              onRemove={handleRemove}
            />
          </Stack>
        </Box>
      );
      

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Linked Operational Objects"
            description="View or remove linked items"
        >
            <TabContext value={activeTab}>
                <Box sx={{ mb: 3 }}>
                    <TabBar
                        tabs={[
                            { label: "Controls", value: "controls" },
                            { label: "Risks", value: "risks" },
                            { label: "Evidence", value: "evidence" },
                        ]}
                        activeTab={activeTab}
                        onChange={(_, newVal) => setActiveTab(newVal)}
                    />
                </Box>

                {/* ---------- TAB CONTENT ---------- */}
                {activeTab === "controls" &&
                    renderSection(controls, "control", "Control")}
                {activeTab === "risks" && renderSection(risks, "risk", "Risk")}
                {activeTab === "evidence" &&
                    renderSection(evidence, "evidence", "Evidence")}
            </TabContext>
        </StandardModal>
    );
};

export default LinkedPolicyModal;
