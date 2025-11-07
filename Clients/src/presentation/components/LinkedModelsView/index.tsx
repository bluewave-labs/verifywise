import { useEffect, useState, ReactNode } from "react";
import {
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";
import CustomizableSkeleton from "../Skeletons";
import singleTheme from "../../themes/v1SingleTheme";
import { ModelInventoryStatus } from "../../../domain/enums/modelInventory.enum";
import SkeletonCard from "../SkeletonCard";

const TABLE_COLUMNS = [
  { id: "provider", label: "PROVIDER" },
  { id: "model", label: "MODEL" },
  { id: "version", label: "VERSION" },
  { id: "status", label: "STATUS" },
];

const StatusBadge: React.FC<{ status: ModelInventoryStatus }> = ({
  status,
}) => {
  const statusStyles = {
    [ModelInventoryStatus.APPROVED]: { bg: "#E6F4EA", color: "#138A5E" },
    [ModelInventoryStatus.PENDING]: { bg: "#FFF8E1", color: "#795548" },
    [ModelInventoryStatus.RESTRICTED]: { bg: "#FFE5D0", color: "#E64A19" },
    [ModelInventoryStatus.BLOCKED]: { bg: "#FFD6D6", color: "#D32F2F" },
  };

  const style = statusStyles[status] || { bg: "#E0E0E0", color: "#424242" };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: "4px",
        fontWeight: 500,
        fontSize: 11,
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
};

interface LinkedModelsViewProps {
  // Function to fetch models - should return Promise<IModelInventory[]>
  fetchModels: () => Promise<IModelInventory[]>;
  // Optional header content (e.g., framework toggle)
  headerContent?: ReactNode;
  // Refresh trigger for forcing re-fetches
  refreshTrigger?: number;
  // Empty state message
  emptyMessage?: string;
}

const LinkedModelsView = ({
  fetchModels,
  headerContent,
  refreshTrigger,
  emptyMessage = "No AI models linked yet",
}: LinkedModelsViewProps) => {
  const [linkedModels, setLinkedModels] = useState<IModelInventory[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoadingModels(true);
      try {
        const models = await fetchModels();
        setLinkedModels(models);
      } catch (error) {
        console.error("Error fetching linked models:", error);
        setLinkedModels([]);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchData();
  }, [fetchModels, refreshTrigger]);

  if (loadingModels) {
    return (
      <Stack spacing={3}>
        {headerContent}
        <Stack sx={{ pt: 2 }}>
          <CustomizableSkeleton variant="rectangular" width="100%" height={300} />
        </Stack>
      </Stack>
    );
  }

  if (linkedModels.length === 0) {
    return (
      <Stack spacing={3}>
        {headerContent}
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minHeight: 300,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ mb: '20px' }}>
            <SkeletonCard showHalo={false} />
          </Box>
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 13,
              textAlign: "center",
              maxWidth: 500,
              fontWeight: 400,
            }}
          >
            {emptyMessage}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.text.tertiary,
              fontSize: 12,
              mt: 1,
              textAlign: "center",
              maxWidth: 500,
            }}
          >
            To link a model to this framework, you first need to add it to your model inventory. When adding a model, you can select which framework(s) to link it to.{" "}
            <Link
              onClick={() => navigate("/model-inventory")}
              sx={{
                color: "#13715B",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                display: "inline",
                "&:hover": {
                  color: "#0F5A47",
                },
              }}
            >
              Go to Model Inventory
            </Link>
          </Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {headerContent}
      <Stack sx={{ pt: 2 }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead
              sx={{
                backgroundColor:
                  singleTheme.tableStyles.primary.header.backgroundColors,
              }}
            >
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {TABLE_COLUMNS.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={singleTheme.tableStyles.primary.header.cell}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedModels.map((model) => (
                <TableRow
                  key={model.id}
                  sx={singleTheme.tableStyles.primary.body.row}
                >
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {model.provider || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {model.model || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {model.version || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <StatusBadge status={model.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  );
};

export default LinkedModelsView;
