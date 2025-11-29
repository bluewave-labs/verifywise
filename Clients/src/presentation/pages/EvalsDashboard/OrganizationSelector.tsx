import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Divider,
} from "@mui/material";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import { Beaker, CirclePlus } from "lucide-react";

interface Props {
  onSelected: () => void;
}

export default function OrganizationSelector({ onSelected }: Props) {
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "" });

  useEffect(() => {
    const load = async () => {
      const { orgs } = await deepEvalOrgsService.getAllOrgs();
      setOrgs(orgs);
    };
    load();
  }, []);

  const handlePick = async (orgId: string) => {
    await deepEvalOrgsService.setCurrentOrg(orgId);
    onSelected();
  };

  return (
    <Box>
      {/* Description + header */}
      <Stack spacing={2} mb={4}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Organize your evaluations under an organization. Select an existing organization or create a new one to get started.
        </Typography>
        <Divider sx={{ mt: 3 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, pb: 2 }}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Organizations
          </Typography>
          <CustomizableButton
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<CirclePlus size={18} />}
            sx={{ textTransform: "none", backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0f5a47" } }}
          >
            Create organization
          </CustomizableButton>
        </Stack>
      </Stack>

      {orgs.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 12,
            px: 3,
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            minHeight: 360,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Beaker size={64} color="#9CA3AF" strokeWidth={1.5} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "18px", color: "#111827" }}>
            No organizations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: "14px", maxWidth: 480, lineHeight: 1.6, color: "#6B7280" }}>
            Create your first organization to start managing projects and experiments.
          </Typography>
          <CustomizableButton
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<CirclePlus size={18} />}
            sx={{ textTransform: "none", backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0f5a47" } }}
          >
            Create your first organization
          </CustomizableButton>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orgs.map((o) => (
            <Grid item xs={12} sm={6} md={4} key={o.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #E5E7EB",
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-2px)",
                    borderColor: "#13715B",
                  },
                }}
                onClick={() => handlePick(o.id)}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {o.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: "13px", color: "#6B7280" }}>
                    Click to enter
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0, gap: 1, borderTop: "1px solid #F3F4F6" }}>
                  <CustomizableButton
                    size="small"
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePick(o.id);
                    }}
                    sx={{ textTransform: "none", fontSize: "13px", backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0f5a47" } }}
                  >
                    Open
                  </CustomizableButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Organization Modal */}
      <StandardModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewOrg({ name: "" });
        }}
        title="Create organization"
        description="Name your organization to begin organizing projects and experiments."
        onSubmit={async () => {
          if (!newOrg.name.trim()) return;
          setCreating(true);
          try {
            const { org } = await deepEvalOrgsService.createOrg(newOrg.name.trim());
            // Persist as current org and close modal
            await deepEvalOrgsService.setCurrentOrg(org.id);
            setCreateOpen(false);
            setNewOrg({ name: "" });
            onSelected();
          } finally {
            setCreating(false);
          }
        }}
        submitButtonText="Create organization"
        isSubmitting={creating || !newOrg.name.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Organization name"
            value={newOrg.name}
            onChange={(e) => setNewOrg({ name: e.target.value })}
            placeholder="e.g., VerifyEvals"
            isRequired
          />
        </Stack>
      </StandardModal>
    </Box>
  );
}


