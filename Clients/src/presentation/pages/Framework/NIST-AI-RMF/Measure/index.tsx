import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import { useCallback, useEffect, useState } from "react";
import { updateNISTAIRMFSubcategoryStatus } from "../../../../components/StatusDropdown/statusUpdateApi";
import { styles } from "../../ISO27001/Clause/style";
import { ArrowRight as RightArrowBlack } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import StatusDropdown from "../../../../components/StatusDropdown";
import { useAuth } from "../../../../../application/hooks/useAuth";
import allowedRoles from "../../../../../application/constants/permissions";
import { Project } from "../../../../../domain/types/Project";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { AlertProps } from "../../../../../domain/interfaces/iAlert";
import NISTAIRMFDrawerDialog from "../../../../components/Drawer/NISTAIRMFDashboardDrawerDialog";
import { NISTAIRMFFunction } from "../types";

interface NISTAIRMFMeasureProps {
  project: Project;
  projectFrameworkId: number | string;
  statusFilter?: string;
}

const NISTAIRMFMeasure = ({
  project: _project,
  projectFrameworkId: _projectFrameworkId,
  statusFilter,
}: NISTAIRMFMeasureProps) => {
  const { userId: _userId, userRoleName } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [subcategoriesMap, setSubcategoriesMap] = useState<{
    [key: number]: any[];
  }>({});
  const [loadingSubcategories, setLoadingSubcategories] = useState<{
    [key: number]: boolean;
  }>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const categoryId = searchParams.get("categoryId");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getEntityById({
        routeUrl: `/nist-ai-rmf/categories/MEASURE`,
      });
      setCategories(response.data || []);
      setSubcategoriesMap({});
    } catch (error) {
      console.error("Error fetching NIST AI RMF categories:", error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  const fetchSubcategories = useCallback(
    async (categoryId: number, title: string) => {
      setLoadingSubcategories((prev) => ({ ...prev, [categoryId]: true }));
      try {
        const response = await getEntityById({
          routeUrl: `/nist-ai-rmf/subcategories/${categoryId}/${title}`,
        });
        const detailedSubcategories = response.data;

        // Apply status filter if provided
        let filteredSubcategories = detailedSubcategories;
        if (statusFilter && statusFilter !== "all") {
          filteredSubcategories = detailedSubcategories.filter(
            (subcategory: any) => subcategory.status === statusFilter
          );
        }

        setSubcategoriesMap((prev) => ({
          ...prev,
          [categoryId]: filteredSubcategories,
        }));
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubcategoriesMap((prev) => ({ ...prev, [categoryId]: [] }));
      } finally {
        setLoadingSubcategories((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    if (expanded !== false && !subcategoriesMap[expanded]) {
      const category = categories.find((c) => c.id === expanded);
      if (category) {
        fetchSubcategories(expanded, "MEASURE");
      }
    }
  }, [categories, expanded, fetchSubcategories, subcategoriesMap]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      // Update URL parameters when accordion changes
      if (isExpanded) {
        searchParams.set("categoryId", String(panel));
        searchParams.set("functionId", "MEASURE");
        setSearchParams(searchParams);
      } else {
        searchParams.delete("categoryId");
        searchParams.delete("subcategoryId");
        setSearchParams(searchParams);
      }
    };

  const handleSubcategoryClick = useCallback(
    (category: any, subcategory: any, _index: number) => {
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      setDrawerOpen(true);
    },
    []
  );

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSubcategory(null);
    setSelectedCategory(null);
  };

  const handleDrawerSaveSuccess = (success: boolean, _message?: string, savedSubcategoryId?: number) => {
    if (success && savedSubcategoryId) {
      // Set flashing row ID for green highlighting
      setFlashingRowId(savedSubcategoryId);
      setTimeout(() => setFlashingRowId(null), 2000);

      // Refresh the data after successful save
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleStatusUpdate = async (
    updatedStatus: string,
    subcategory: any,
    index: number
  ): Promise<boolean> => {
    try {
      // Update the local state to show the new status immediately
      if (expanded !== false) {
        setSubcategoriesMap((prev) => {
          const updated = { ...prev };
          if (updated[expanded]) {
            updated[expanded] = updated[expanded].map((item, idx) =>
              idx === index ? { ...item, status: updatedStatus } : item
            );
          }
          return updated;
        });
      }

      // Flash the row to indicate it was saved
      setFlashingRowId(subcategory.id);
      setTimeout(() => setFlashingRowId(null), 2000);

      // Call the API to update status
      const success = await updateNISTAIRMFSubcategoryStatus({
        id: subcategory.id,
        newStatus: updatedStatus,
        projectFrameworkId: Number(_projectFrameworkId),
        userId: _userId || 1,
        currentData: subcategory,
      });

      if (success) {
        // Show success alert
        handleAlert({
          variant: "success",
          body: "Status updated successfully",
          setAlert,
        });

        // Trigger a refresh to ensure data consistency
        setRefreshTrigger((prev) => prev + 1);
      } else {
        // Show error alert if update failed
        handleAlert({
          variant: "error",
          body: "Failed to update status",
          setAlert,
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating subcategory status:", error);

      // Show error alert
      handleAlert({
        variant: "error",
        body: "Error updating status",
        setAlert,
      });

      // Revert the status update on error
      if (expanded !== false) {
        setSubcategoriesMap((prev) => {
          const updated = { ...prev };
          if (updated[expanded]) {
            updated[expanded] = updated[expanded].map((item, idx) =>
              idx === index ? { ...item, status: subcategory.status } : item
            );
          }
          return updated;
        });
      }

      return false;
    }
  };

  // Set initial expanded state based on URL parameters
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find((c) => c.id === Number(categoryId));
      if (category) {
        setExpanded(category.id);
      }
    }
  }, [categoryId, categories]);

  function dynamicSubcategories(category: any) {
    const subcategories = subcategoriesMap[category.id ?? 0] || [];
    const isLoading = loadingSubcategories[category.id ?? 0];

    const filteredSubcategories =
      statusFilter && statusFilter !== ""
        ? subcategories.filter(
            (sc) => sc.status?.toLowerCase() === statusFilter.toLowerCase()
          )
        : subcategories;

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {isLoading ? (
          <Stack sx={styles.loadingContainer}>
            <CircularProgress size={24} />
          </Stack>
        ) : filteredSubcategories.length > 0 ? (
          filteredSubcategories.map((subcategory: any, index: number) => (
            <Stack
              key={subcategory.id}
              onClick={() => {
                handleSubcategoryClick(category, subcategory, index);
              }}
              sx={styles.subClauseRow(
                filteredSubcategories.length - 1 === index,
                flashingRowId === subcategory.id
              )}
            >
              <Stack sx={{ flex: 1, pr: 2 }}>
                <Typography fontSize={13} fontWeight={600} color="#1a1a1a">
                  {category.title} {category.index}.{index + 1}
                </Typography>
                {subcategory.description && (
                  <Typography
                    fontSize={12}
                    sx={{
                      mt: 1,
                      color: "#666",
                      lineHeight: 1.4,
                      fontWeight: 400,
                    }}
                  >
                    {subcategory.description}
                  </Typography>
                )}
              </Stack>
              <StatusDropdown
                currentStatus={subcategory.status ?? "Not started"}
                onStatusChange={(newStatus) =>
                  handleStatusUpdate(newStatus, subcategory, index)
                }
                size="small"
                allowedRoles={allowedRoles.frameworks.edit}
                userRole={userRoleName}
              />
            </Stack>
          ))
        ) : (
          <Stack sx={styles.noSubClausesContainer}>
            No matching subcategories
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  return (
    <Stack className="nist-ai-rmf-measure" spacing={0}>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      <Typography
        sx={{
          ...styles.title,
          mt: 4,
          mb: 3,
          fontSize: 15,
          fontWeight: 600,
          color: "#1a1a1a",
        }}
      >
        NIST AI RMF - Measure Categories
      </Typography>
      {categories &&
        categories.map((category: any) => (
          <Stack key={category.id} sx={{ ...styles.container, marginBottom: "8px" }}>
            <Accordion
              key={category.id}
              expanded={expanded === category.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(category.id ?? 0)}
            >
              <AccordionSummary
                sx={{
                  ...styles.accordionSummary,
                  minHeight: 64,
                  "& .MuiAccordionSummary-content": {
                    margin: "16px 0",
                    "&.Mui-expanded": {
                      margin: "20px 0",
                    },
                  },
                }}
              >
                <RightArrowBlack
                  size={16}
                  style={
                    styles.expandIcon(
                      expanded === category.id
                    ) as React.CSSProperties
                  }
                />
                <Stack sx={{ paddingLeft: "2.5px", flex: 1 }}>
                  <Typography
                    fontSize={13}
                    fontWeight={600}
                    color="#1a1a1a"
                    sx={{ lineHeight: 1.3 }}
                  >
                    {category.title}
                    {category.index !== undefined && category.index !== null
                      ? ` ${category.index}`
                      : ""}
                  </Typography>
                  {category.description && (
                    <Typography
                      fontSize={12}
                      sx={{
                        mt: 1,
                        color: "#666",
                        lineHeight: 1.4,
                        fontWeight: 400,
                      }}
                    >
                      {category.description}
                    </Typography>
                  )}
                </Stack>
              </AccordionSummary>
              {dynamicSubcategories(category)}
            </Accordion>
          </Stack>
        ))}

      {/* NIST AI RMF Subcategory Details Drawer */}
      <NISTAIRMFDrawerDialog
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSaveSuccess={handleDrawerSaveSuccess}
        subcategory={selectedSubcategory}
        category={selectedCategory}
        function={NISTAIRMFFunction.MEASURE}
      />
    </Stack>
  );
};

export default NISTAIRMFMeasure;
