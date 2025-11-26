import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import HelperDrawer from "../../components/HelperDrawer";
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

const PolicyDashboard: React.FC = () => {
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
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
        <HelperDrawer
          open={isHelperDrawerOpen}
          onClose={() => setIsHelperDrawerOpen(false)}
          title="Policy manager"
          description="Create, manage, and maintain AI governance policies using pre-built templates or custom documentation"
          whatItDoes="Centralize *policy creation*, *version control*, and *distribution* for all *AI-related governance documentation*. Start from *industry-standard templates* or create custom policies. Track *policy reviews*, *approvals*, and *acknowledgments* across your organization."
          whyItMatters="**Well-documented policies** are the foundation of effective *AI governance*. They demonstrate your commitment to *responsible AI*, ensure *consistent practices* across teams, and satisfy *regulatory requirements* for documented controls."
          quickActions={[
            {
              label: "Browse Policy Templates",
              description:
                "Explore pre-built templates aligned with AI regulations and standards",
              primary: true,
            },
            {
              label: "Create Custom Policy",
              description:
                "Draft custom governance policies for your organization",
            },
            {
              label: "Review Policy Status",
              description:
                "Check approval status and track policy acknowledgments",
            },
          ]}
          useCases={[
            "*AI ethics policies* defining *acceptable use* and *development principles*",
            "*Data governance policies* for handling *sensitive information* in *AI systems*",
            "*Compliance templates* for *EU AI Act*, *ISO 42001*, and *NIST AI RMF*",
          ]}
          keyFeatures={[
            "**Pre-built policy templates** covering *AI governance*, *model lifecycle*, *security*, and *compliance*",
            "**Policy lifecycle management** from *draft* through *approval* to *retirement*",
            "*Version control* with *change tracking* and *approval workflows*",
            "*Distribution tracking* to ensure all *stakeholders* have *acknowledged current policies*",
          ]}
          tips={[
            "Start with *policy templates* and customize them to your *organization's needs*",
            "Browse templates by category: *Core governance*, *Model lifecycle*, *Data security*, *Legal compliance*, and *Industry-specific*",
            "Schedule *regular policy reviews* to ensure they remain *current and relevant*",
            "Track *acknowledgments* to demonstrate *policy awareness* across your teams",
          ]}
        />

        <PageHeader
          title="Policy manager"
          description="Create and manage AI governance policies using pre-built templates or custom documentation to stay compliant and consistent."
          rightContent={
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
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
