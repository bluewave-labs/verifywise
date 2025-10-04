import { useEffect, useState, useCallback } from "react";
import { getAllEntities } from "../repository/entity.repository";

// Types for the additional dashboard metrics
export interface RiskMetrics {
  total: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
    resolved: number;
  };
  recent: Array<{
    id: number;
    title: string;
    severity: "high" | "medium" | "low";
    created_at: string;
    project_name: string;
  }>;
}

export interface EvidenceMetrics {
  total: number;
  recent: Array<{
    id: number;
    title: string;
    uploaded_at: string;
    project_name: string;
    user_name: string;
  }>;
}

export interface AssessmentProgress {
  project_id: number;
  project_name: string;
  assessments: {
    completed: number;
    total: number;
  };
  controls: {
    completed: number;
    total: number;
  };
}

export interface RecentActivity {
  id: number;
  type: "project" | "risk" | "evidence" | "assessment";
  title: string;
  action: string;
  timestamp: string;
  user_name: string;
  project_name?: string;
}

export interface UpcomingTask {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: "high" | "medium" | "low";
  project_name: string;
  assigned_to: string;
}

export interface ComplianceStatus {
  eu_ai_act: {
    percentage: number;
    status: "compliant" | "partial" | "non_compliant";
  };
  gdpr: {
    percentage: number;
    status: "compliant" | "partial" | "non_compliant";
  };
  iso_27001: {
    percentage: number;
    status: "compliant" | "partial" | "non_compliant";
  };
}

export interface UserActivityMetrics {
  active_users: number;
  user_engagement: number;
  actions_today: number;
  task_completion_rate: number;
}

export interface VendorRiskMetrics {
  total: number;
  recent: Array<{
    id: number;
    title: string;
    severity: "high" | "medium" | "low";
    created_at: string;
    vendor_name: string;
  }>;
}

export interface VendorMetrics {
  total: number;
  recent: Array<{
    id: number;
    name: string;
    created_at: string;
    status: string;
  }>;
}

export interface UsersMetrics {
  total: number;
  recent: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string;
    role: string;
  }>;
}

export interface PolicyMetrics {
  total: number;
  recent: Array<{
    id: string;
    title: string;
    status: string;
    last_updated_at: string;
    author_id: number;
  }>;
}

export interface AITrustCenterStatus {
  enabled: boolean;
  last_updated: string;
  compliance_score: number;
}

// Main hook for dashboard metrics
export const useDashboardMetrics = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [evidenceMetrics, setEvidenceMetrics] =
    useState<EvidenceMetrics | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState<
    AssessmentProgress[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [complianceStatus, setComplianceStatus] =
    useState<ComplianceStatus | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityMetrics | null>(
    null
  );
  const [aiTrustCenter, setAiTrustCenter] =
    useState<AITrustCenterStatus | null>(null);
  const [vendorRiskMetrics, setVendorRiskMetrics] =
    useState<VendorRiskMetrics | null>(null);
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetrics | null>(
    null
  );
  const [usersMetrics, setUsersMetrics] = useState<UsersMetrics | null>(null);
  const [policyMetrics, setPolicyMetrics] = useState<PolicyMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch risk metrics - using main dashboard endpoint
  const fetchRiskMetrics = useCallback(async () => {
    try {
      console.log("Fetching risk metrics from main dashboard...");
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default risk metrics since dashboard doesn't provide risk-specific data
      setRiskMetrics({
        total: 0,
        distribution: { high: 0, medium: 0, low: 0, resolved: 0 },
        recent: [],
      });
      console.log("Risk metrics set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setRiskMetrics(null);
    }
  }, []);

  // Fetch evidence metrics (from /files endpoint)
  const fetchEvidenceMetrics = useCallback(async () => {
    try {
      // Use the /files endpoint for actual evidence files
      const response = await getAllEntities({ routeUrl: "/files" });

      // The /files endpoint returns data directly in the response, not nested under response.data
      const filesData = response.data || response.files || response;
      const filesArray = Array.isArray(filesData) ? filesData : [];

      const evidenceMetrics = {
        total: filesArray.length,
        recent: filesArray.slice(0, 5).map((file: any, index: number) => ({
          id: file.id || index + 1,
          title: file.filename || file.name || "Evidence File",
          uploaded_at:
            file.uploaded_time ||
            file.created_at ||
            file.updated_at ||
            new Date().toISOString(),
          project_name: file.project_title || file.project_name || "General",
          user_name:
            `${file.uploader_name || ""} ${
              file.uploader_surname || ""
            }`.trim() || "System",
        })),
      };

      setEvidenceMetrics(evidenceMetrics);
      console.log("Evidence metrics from /files endpoint:", evidenceMetrics);
    } catch (err) {
      console.log("API files endpoint not available:", err);
      setEvidenceMetrics(null);
    }
  }, []);

  // Fetch assessment progress - using main dashboard endpoint
  const fetchAssessmentProgress = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default assessment progress since dashboard doesn't provide assessment-specific data
      setAssessmentProgress([]);
      console.log("Assessment progress set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setAssessmentProgress([]);
    }
  }, []);

  // Fetch recent activity - using main dashboard endpoint
  const fetchRecentActivity = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default recent activity since dashboard doesn't provide activity-specific data
      setRecentActivity([]);
      console.log("Recent activity set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setRecentActivity([]);
    }
  }, []);

  // Fetch upcoming tasks - using main dashboard endpoint
  const fetchUpcomingTasks = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default upcoming tasks since dashboard doesn't provide task-specific data
      setUpcomingTasks([]);
      console.log("Upcoming tasks set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setUpcomingTasks([]);
    }
  }, []);

  // Fetch compliance status - using main dashboard endpoint
  const fetchComplianceStatus = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default compliance status since dashboard doesn't provide compliance-specific data
      setComplianceStatus(null);
      console.log("Compliance status set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setComplianceStatus(null);
    }
  }, []);

  // Fetch user activity metrics - using main dashboard endpoint
  const fetchUserActivity = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default user activity since dashboard doesn't provide user activity-specific data
      setUserActivity(null);
      console.log("User activity set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setUserActivity(null);
    }
  }, []);

  // Fetch AI Trust Center status - using main dashboard endpoint
  const fetchAITrustCenter = useCallback(async () => {
    try {
      await getAllEntities({ routeUrl: "/dashboard" });
      // Set default AI Trust Center status since dashboard doesn't provide AI Trust Center-specific data
      setAiTrustCenter(null);
      console.log("AI Trust Center status set to default values");
    } catch (err) {
      console.log("Dashboard endpoint not available");
      setAiTrustCenter(null);
    }
  }, []);

  // Fetch vendor risk metrics - using vendorRisks endpoint
  const fetchVendorRiskMetrics = useCallback(async () => {
    try {
      console.log("Fetching vendor risk metrics...");
      const response = await getAllEntities({ routeUrl: "/vendorRisks/all" });
      console.log("Vendor risks response:", response);

      // Handle the API response structure: { message: "ok", data: [...] }
      const risksData = response.data || [];
      const risksArray = Array.isArray(risksData) ? risksData : [];
      console.log("Parsed vendor risks data:", risksArray);

      const vendorRiskMetrics = {
        total: risksArray.length,
        recent: risksArray.slice(0, 5).map((risk: any, index: number) => ({
          id: risk.id || index + 1,
          title: risk.risk_name || risk.title || "Vendor Risk",
          severity:
            risk.risk_level?.toLowerCase().replace(" risk", "") || "medium",
          created_at:
            risk.review_date || risk.created_at || new Date().toISOString(),
          vendor_name: risk.vendor_name || "Unknown Vendor",
        })),
      };

      setVendorRiskMetrics(vendorRiskMetrics);
      console.log(
        "Vendor risk metrics fetched successfully:",
        vendorRiskMetrics
      );
    } catch (err) {
      console.log("Vendor risk metrics endpoint not available:", err);
      setVendorRiskMetrics(null);
    }
  }, []);

  // Fetch vendor metrics
  const fetchVendorMetrics = useCallback(async () => {
    try {
      console.log("Fetching vendor metrics...");
      const response = await getAllEntities({ routeUrl: "/vendors" });
      console.log("Vendor metrics response:", response);

      // Handle the API response structure
      const vendorsData = response.data || response.vendors || response;
      const vendorsArray = Array.isArray(vendorsData) ? vendorsData : [];
      console.log("Parsed vendor data:", vendorsArray);

      const vendorMetrics = {
        total: vendorsArray.length,
        recent: vendorsArray.slice(0, 5).map((vendor: any, index: number) => ({
          id: vendor.id || index + 1,
          name:
            vendor.name ||
            vendor.vendor_name ||
            vendor.company_name ||
            "Unknown Vendor",
          created_at:
            vendor.created_at || vendor.createdAt || new Date().toISOString(),
          status: vendor.status || vendor.vendor_status || "Active",
        })),
      };

      setVendorMetrics(vendorMetrics);
      console.log("Vendor metrics fetched successfully:", vendorMetrics);
    } catch (err) {
      console.log("Vendor metrics endpoint not available:", err);
      setVendorMetrics(null);
    }
  }, []);

  // Fetch users metrics
  const fetchUsersMetrics = useCallback(async () => {
    try {
      console.log("Fetching users metrics...");
      const response = await getAllEntities({ routeUrl: "/users" });
      console.log("Users metrics response:", response);

      // Handle the API response structure
      const usersData = response.data || response.users || response;
      const usersArray = Array.isArray(usersData) ? usersData : [];
      console.log("Parsed users data:", usersArray);

      const usersMetrics = {
        total: usersArray.length,
        recent: usersArray.slice(0, 5).map((user: any, index: number) => ({
          id: user.id || index + 1,
          name:
            `${user.first_name || user.firstName || ""} ${
              user.last_name || user.lastName || ""
            }`.trim() ||
            user.name ||
            user.username ||
            "User",
          email: user.email || "No email",
          created_at:
            user.created_at || user.createdAt || new Date().toISOString(),
          role: user.role || user.user_role || "User",
        })),
      };

      setUsersMetrics(usersMetrics);
      console.log("Users metrics fetched successfully:", usersMetrics);
    } catch (err) {
      console.log("Users metrics endpoint not available:", err);
      setUsersMetrics(null);
    }
  }, []);

  // Fetch policy metrics
  const fetchPolicyMetrics = useCallback(async () => {
    try {
      console.log("Fetching policy metrics...");
      const response = await getAllEntities({ routeUrl: "/policies" });
      console.log("Policy metrics response:", response);

      // Handle the special API response structure: { data: { data: Policy[] } }
      const policiesData =
        response.data?.data || response.data || response.policies || response;
      const policiesArray = Array.isArray(policiesData) ? policiesData : [];
      console.log("Parsed policy data:", policiesArray);

      const policyMetrics = {
        total: policiesArray.length,
        recent: policiesArray.slice(0, 5).map((policy: any) => ({
          id: policy.id || "unknown",
          title: policy.title || "Untitled Policy",
          status: policy.status || "unknown",
          last_updated_at: policy.last_updated_at || new Date().toISOString(),
          author_id: policy.author_id || 0,
        })),
      };

      setPolicyMetrics(policyMetrics);
      console.log("Policy metrics fetched successfully:", policyMetrics);
    } catch (err) {
      console.log("Policy metrics endpoint not available:", err);
      setPolicyMetrics(null);
    }
  }, []);

  // Fetch all dashboard metrics safely
  const fetchAllMetrics = useCallback(async () => {
    console.log("fetchAllMetrics: Starting...");
    setLoading(true);
    setError(null);

    try {
      // Fetch each metric individually and catch errors
      const results = await Promise.allSettled([
        fetchRiskMetrics(),
        fetchEvidenceMetrics(),
        fetchAssessmentProgress(),
        fetchRecentActivity(),
        fetchUpcomingTasks(),
        fetchComplianceStatus(),
        fetchUserActivity(),
        fetchAITrustCenter(),
        fetchVendorRiskMetrics(),
        fetchVendorMetrics(),
        fetchUsersMetrics(),
        fetchPolicyMetrics(),
      ]);

      // Log which ones failed
      results.forEach((result, index) => {
        const metricNames = [
          "riskMetrics",
          "evidenceMetrics",
          "assessmentProgress",
          "recentActivity",
          "upcomingTasks",
          "complianceStatus",
          "userActivity",
          "aiTrustCenter",
          "vendorRiskMetrics",
          "vendorMetrics",
          "usersMetrics",
          "policyMetrics",
        ];

        if (result.status === "rejected") {
          console.warn(`Failed to fetch ${metricNames[index]}:`, result.reason);
        } else {
          console.log(`Successfully fetched ${metricNames[index]}`);
        }
      });
    } catch (err) {
      setError("Failed to fetch dashboard metrics");
      console.error("Error fetching dashboard metrics:", err);
    } finally {
      setLoading(false);
      console.log("fetchAllMetrics: Completed");
    }
  }, [
    fetchRiskMetrics,
    fetchEvidenceMetrics,
    fetchAssessmentProgress,
    fetchRecentActivity,
    fetchUpcomingTasks,
    fetchComplianceStatus,
    fetchUserActivity,
    fetchAITrustCenter,
    fetchVendorRiskMetrics,
    fetchVendorMetrics,
    fetchUsersMetrics,
    fetchPolicyMetrics,
  ]);

  // Initialize data on mount
  useEffect(() => {
    console.log("useDashboardMetrics: Fetching dashboard metrics...");
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  return {
    // Data
    riskMetrics,
    evidenceMetrics,
    assessmentProgress,
    recentActivity,
    upcomingTasks,
    complianceStatus,
    userActivity,
    aiTrustCenter,
    vendorRiskMetrics,
    vendorMetrics,
    usersMetrics,
    policyMetrics,

    // State
    loading,
    error,

    // Actions
    fetchAllMetrics,
    fetchRecentActivity,
    fetchRiskMetrics,
    fetchEvidenceMetrics,
    fetchAssessmentProgress,
    fetchUpcomingTasks,
    fetchComplianceStatus,
    fetchUserActivity,
    fetchAITrustCenter,
    fetchVendorRiskMetrics,
    fetchVendorMetrics,
    fetchUsersMetrics,
    fetchPolicyMetrics,
  };
};
