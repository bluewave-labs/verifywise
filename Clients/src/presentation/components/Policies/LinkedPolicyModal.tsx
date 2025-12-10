/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { Box, Stack} from "@mui/material";
import { TabContext } from "@mui/lab";
import StandardModal from "../Modals/StandardModal";
import TabBar from "../TabBar";
import { deleteEntityById, getAllEntities } from "../../../application/repository/entity.repository";
import { addNewModelButtonStyle } from "../../../presentation/pages/ModelInventory/style";
import CustomizableButton from "../Button/CustomizableButton";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import LinkedObjectsTable from "./LinkedPoliciesTable";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { RiskModel } from "../../../domain/models/Common/risks/risk.model";
import { handleAlert } from "../../../application/tools/alertUtils";
import LinkRiskSelectorModal from "./LinkRiskSelectorModal";
import { createPolicyLinkedObjects } from "../../../application/repository/policyLinkedObjects.repository";

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

    const [projectRisk, setProjectRisks] = useState<RiskModel[]>([]);

    const [openRiskSelector, setOpenRiskSelector] = useState(false);

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
    }, [isOpen, policyId, projectRisk]);

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

      useEffect(() => {
        console.log("Updated risks", risks);
      }, [risks]);
      

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

      await deleteEntityById({
        routeUrl:`/policy-linked/${id}/linked-objects`,
      });


        if (type === "control")
            setControls((prev) => prev.filter((i) => i.id !== id));
        if (type === "risk")
            setRisks((prev) => prev.filter((i) => i.id !== id));
          console.log("risk", risks)
        if (type === "evidence")
            setEvidence((prev) => prev.filter((i) => i.id !== id));

        handleToast("success", "Risks unlinked successfully!");
    };


    const handleAddRisks = async (riskIds: number[]) => {

      console.log("RiskIds", riskIds);
      try {
       const response = await createPolicyLinkedObjects(
          `/policy-linked/${policyId}/linked-objects`,
          {
            object_type: "risk",
            object_ids: riskIds,
          }
        );

        console.log("response", response);
    
        // Re-fetch updated linked objects to update UI
        const updated = await getAllEntities({
          routeUrl: `/policy-linked/${policyId}/linked-objects`,
        });
    
        setRisks(updated.data.risks || []);
        handleToast("success", "Risks linked successfully!");
      } catch (error) {
        console.error(error);
        handleToast("error", "Failed to link risks.");
      }
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
                onClick={() => {
                  if (type === "risk") setOpenRiskSelector(true);
               }}
               
              />
            </Box>

            {/* ---------- TABLE LIST ---------- */}
            <LinkedObjectsTable
              items={items}
              onRemove={handleRemove}
              projectRisk={projectRisk}
              paginated={true}
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
                {activeTab === "risks" &&
                    renderSection(
                      risks.length ? risks : [], // <-- empty array if no risks
                      "risk",
                      "Risk"
                    )}
                {activeTab === "evidence" &&
                    renderSection(evidence, "evidence", "Evidence")}
            </TabContext>

            <LinkRiskSelectorModal
                isOpen={openRiskSelector}
                onClose={() => setOpenRiskSelector(false)}
                policyId={policyId!}
                linkedRiskIds={risks.map((r) => r.object_id)}
                onSubmit={handleAddRisks}
                paginated={true}
            />

        </StandardModal>
    );
};

export default LinkedPolicyModal;
