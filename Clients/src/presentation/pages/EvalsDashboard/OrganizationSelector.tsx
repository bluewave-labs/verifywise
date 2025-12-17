import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";
import { Building2, Users, FolderKanban, Calendar } from "lucide-react";

interface Props {
  onSelected: () => void;
}

interface Organization {
  id: string;
  name: string;
  created_at?: string;
  createdAt?: string;
  projects_count?: number;
  member_ids?: number[];
}

export default function OrganizationSelector({ onSelected }: Props) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrEnsureOrg();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrEnsureOrg = async () => {
    try {
      setLoading(true);
      const { orgs } = await deepEvalOrgsService.getAllOrgs();
      
      if (orgs && orgs.length > 0) {
        // Use the first (default) organization
        const defaultOrg = orgs[0];
        
        // Load project count
        try {
          const projectIds = await deepEvalOrgsService.getProjectsForOrg(defaultOrg.id);
          setOrg({ ...defaultOrg, projects_count: projectIds.length });
        } catch {
          setOrg({ ...defaultOrg, projects_count: 0 });
        }
        
        // Ensure this org is selected
        await deepEvalOrgsService.setCurrentOrg(defaultOrg.id);
        onSelected();
      } else {
        // No organizations exist - the backend should auto-create one
        // This shouldn't happen normally, but handle gracefully
        console.log("No organization found - waiting for auto-creation...");
        // Retry after a short delay
        setTimeout(() => loadOrEnsureOrg(), 2000);
      }
    } catch (err) {
      console.error("Failed to load organization:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (org: Organization) => {
    const dateStr = org.created_at || org.createdAt;
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (!org) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">
          Setting up your organization...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
          Organization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Your organization manages all projects and evaluations. This is automatically created for your account.
        </Typography>
      </Stack>

      {/* Organization Card */}
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          backgroundColor: "#FFFFFF",
          p: 3,
        }}
      >
        {/* Organization Name */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#F0FDF4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={24} color="#13715B" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>
              {org.name}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
              Default organization
            </Typography>
          </Box>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={4}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                backgroundColor: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderKanban size={18} color="#6B7280" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                {org.projects_count ?? 0}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                Projects
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                backgroundColor: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} color="#6B7280" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                {org.member_ids?.length || 1}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                Members
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                backgroundColor: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={18} color="#6B7280" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                {formatDate(org)}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                Created
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
