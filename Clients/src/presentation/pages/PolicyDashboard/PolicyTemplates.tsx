import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Stack, TableRow, TableCell } from "@mui/material";
import EmptyState from "../../components/EmptyState";
import policyTemplates from "../../assets/PolicyTemplates.json";
import {
  PolicyTemplate,
  PolicyTemplatesProps,
} from "../../../domain/interfaces/i.policy";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../../domain/interfaces/i.alert";
import { SearchBox } from "../../components/Search";
import { PolicyTemplateCategory } from "../../../domain/enums/policy.enum";
import TagChip from "../../components/Tags/TagChip";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import CustomizablePolicyTable from "../../components/Table/PolicyTable";
import singleTheme from "../../themes/v1SingleTheme";

// Define table headers in the format expected by CustomizablePolicyTable
const tableHeaders = [
  { id: "id", name: "ID" },
  { id: "title", name: "Title" },
  { id: "tags", name: "Tags" },
  { id: "description", name: "Description" },
];

const PolicyTemplates: React.FC<PolicyTemplatesProps> = ({
  tags,
  fetchAll,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedUrlParam = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicyTemplate, setSelectedPolicyTemplate] = useState<
    PolicyTemplate | undefined
  >(undefined);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  // Handle templateId URL param to open modal from Wise Search
  useEffect(() => {
    const templateId = searchParams.get("templateId");
    if (templateId && !hasProcessedUrlParam.current) {
      hasProcessedUrlParam.current = true;
      const id = parseInt(templateId, 10);
      // Find and open the template
      const selectedPolicy = policyTemplates.find((policy) => policy.id === id);
      if (selectedPolicy) {
        const template: PolicyTemplate = {
          title: selectedPolicy.title,
          tags: selectedPolicy.tags,
          content: selectedPolicy.content,
        };
        setSelectedPolicyTemplate(template);
        setShowModal(true);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleClose = () => {
    setShowModal(false);
    setSelectedPolicyTemplate(undefined);
  };

  const handleSelectPolicyTemplate = (id: number) => {
    if (id) {
      const selectedPolicy = policyTemplates.find((policy) => policy.id === id);
      if (selectedPolicy) {
        const template: PolicyTemplate = {
          title: selectedPolicy.title,
          tags: selectedPolicy.tags,
          content: selectedPolicy.content,
        };
        setSelectedPolicyTemplate(template);
        setShowModal(true);
      }
    }
  };

  const handleSaved = (successMessage?: string) => {
    fetchAll();
    handleClose();

    // Show success alert if message is provided
    if (successMessage) {
      handleAlert({
        variant: "success",
        body: successMessage,
        setAlert,
        alertTimeout: 4000, // 4 seconds to give users time to read
      });
    }
  };

  // Define the type for policy template items
  type PolicyTemplateItem = typeof policyTemplates[number];

  // FilterBy - Filter columns configuration
  const policyTemplateFilterColumns: FilterColumn[] = useMemo(() => [
    {
      id: 'title',
      label: 'Title',
      type: 'text' as const,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [...Object.values(PolicyTemplateCategory)].map((value) => ({
        value: value,
        label: value,
      })),
    },
  ], []);

  // FilterBy - Field value getter
  const getPolicyTemplateFieldValue = useCallback(
    (item: PolicyTemplateItem, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case 'title':
          return item.title;
        case 'category':
          return item.category;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const { filterData: filterPolicyTemplateData, handleFilterChange: handlePolicyTemplateFilterChange } = useFilterBy<PolicyTemplateItem>(getPolicyTemplateFieldValue);

  // Filter + search using FilterBy
  const filteredPolicyTemplates = useMemo(() => {
    let result = filterPolicyTemplateData(policyTemplates);

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query)
      );
    }

    return result;
  }, [filterPolicyTemplateData, searchTerm]);

  // Define how to get the group key for each policy template
  const getTemplateGroupKey = useCallback((template: PolicyTemplateItem, field: string): string => {
    switch (field) {
      case 'category':
        return template.category || 'Unknown';
      default:
        return 'Other';
    }
  }, []);

  // Apply grouping to filtered templates
  const groupedTemplates = useTableGrouping({
    data: filteredPolicyTemplates,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getTemplateGroupKey,
  });

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  return (
    <Stack>
      <Stack direction="row" spacing={2} alignItems="center" mb={8}>
        {/* FilterBy */}
        <div data-joyride-id="policy-status-filter">
          <FilterBy
            columns={policyTemplateFilterColumns}
            onFilterChange={handlePolicyTemplateFilterChange}
          />
        </div>

        {/* Group By */}
        <GroupBy
          options={[
            { id: 'category', label: 'Category' },
          ]}
          onGroupChange={handleGroupChange}
        />

        {/* Search */}
        <Box data-joyride-id="policy-search">
          <SearchBox
            placeholder="Search policy templates..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search policy templates" }}
            fullWidth={false}
          />
        </Box>
      </Stack>

      {/* Table */}
      {filteredPolicyTemplates.length === 0 ? (
        <EmptyState message="No policy templates found" />
      ) : (
        <GroupedTableView
          groupedData={groupedTemplates}
          ungroupedData={filteredPolicyTemplates}
          renderTable={(data, options) => (
            <CustomizablePolicyTable
              data={{ rows: data.map(p => ({ ...p, id: p.id })), cols: tableHeaders }}
              paginated
              setSelectedRow={() => {}}
              setAnchorEl={() => {}}
              onRowClick={(id: string) => handleSelectPolicyTemplate(Number(id))}
              hidePagination={options?.hidePagination}
              renderRow={(policy, sortConfig) => (
                <TableRow
                  key={policy.id}
                  tabIndex={0}
                  aria-label={`Policy template: ${policy.title}`}
                  sx={{ ...singleTheme.tableStyles.primary.body.row }}
                  onClick={() => handleSelectPolicyTemplate(policy.id)}
                >
                  <TableCell
                    sx={{
                      ...cellStyle,
                      fontWeight: 500,
                      backgroundColor: sortConfig?.key?.toLowerCase().includes("id") ? "#f5f5f5" : "inherit",
                    }}
                  >
                    {policy.id}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...cellStyle,
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      backgroundColor: sortConfig?.key?.toLowerCase().includes("title") ? "#f5f5f5" : "inherit",
                    }}
                  >
                    {policy.title}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...cellStyle,
                      backgroundColor: sortConfig?.key?.toLowerCase().includes("tags") ? "#f5f5f5" : "inherit",
                    }}
                  >
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {policy.tags.map((tag: string, index: number) => (
                        <TagChip key={`${tag}-${index}`} tag={tag} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...cellStyle,
                      maxWidth: 250,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      backgroundColor: sortConfig?.key?.toLowerCase().includes("description") ? "#f5f5f5" : "inherit",
                    }}
                  >
                    {policy.description}
                  </TableCell>
                </TableRow>
              )}
            />
          )}
        />
      )}

      {/* Modal */}
      {showModal && tags.length > 0 && (
        <PolicyDetailModal
          policy={null}
          tags={tags}
          onClose={handleClose}
          onSaved={handleSaved}
          template={selectedPolicyTemplate}
        />
      )}

      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
    </Stack>
  );
};

export default PolicyTemplates;
