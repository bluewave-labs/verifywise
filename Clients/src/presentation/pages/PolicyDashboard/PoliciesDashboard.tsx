import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import HelperIcon from "../../components/HelperIcon";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import TabBar from "../../components/TabBar";
import PageTour from "../../components/PageTour";
import TipBox from "../../components/TipBox";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";
import {
  getAllPolicies,
  getAllTags,
} from "../../../application/repository/policy.repository";
import PolicyManager from "./PolicyManager";
import PolicyTemplates from "./PolicyTemplates";
import PolicySteps from "./PolicySteps";
import policyTemplates from "../../../application/data/PolicyTemplates.json";

const PolicyDashboard: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyManagerModel[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isPolicyTemplateTab = currentPath.includes("/policies/templates");
  const activeTab = isPolicyTemplateTab ? "templates" : "policies";

  const fetchAll = async () => {
    const [pRes, tRes] = await Promise.all([getAllPolicies(), getAllTags()]);
    setPolicies(pRes);
    setTags(tRes);
    setIsInitialLoadComplete(true);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, tabValue: string) => {
    if (tabValue === "policies") {
      navigate("/policies");
    } else if (tabValue === "templates") {
      navigate("/policies/templates");
    }
  };

  return (
    <Stack className="vwhome" gap={"16px"}>
      <TabContext value={activeTab}>
        <PageBreadcrumbs />

        <PageHeader
          title="Policy manager"
          description="Create and manage AI governance policies using pre-built templates or custom documentation to stay compliant and consistent."
          rightContent={
            <HelperIcon
              articlePath="policies/policy-management"
              size="small"
            />
          }
        />
        <TipBox entityName="policies" />
        <Box sx={{ mt: 2 }}>
          <TabBar
            tabs={[
              {
                label: "Organizational Policies",
                value: "policies",
                icon: "Shield",
                count: policies.length,
              },
              {
                label: "Policy Templates",
                value: "templates",
                icon: "ShieldHalf",
                count: policyTemplates.length,
              },
            ]}
            activeTab={activeTab}
            onChange={handleTabChange}
            dataJoyrideId="policies-list-tab"
          />
        </Box>

        {activeTab === "policies" && (
          <PolicyManager policies={policies} tags={tags} fetchAll={fetchAll} />
        )}
        {activeTab === "templates" && (
          <PolicyTemplates tags={tags} fetchAll={fetchAll} />
        )}

        <PageTour
          steps={PolicySteps}
          run={isInitialLoadComplete}
          tourKey="policy-tour"
        />
      </TabContext>
    </Stack>
  );
};

export default PolicyDashboard;
