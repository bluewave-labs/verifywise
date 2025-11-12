import {
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import StandardModal from "../Modals/StandardModal";
import EmptyState from "../EmptyState";
import { useCallback, useState } from "react";
import policies from "../../assets/PolicyTemplates.json";
import { PolicyTemplate, PolicyTemplatesModalProps } from "../../../domain/interfaces/IPolicy";

const TITLE_OF_COLUMNS = [
  {col: "", width: 50,},
  {col: "ID", width: 50,},
  {col: "TITLE", width: 150,},
  {col: "TAGS", width: 250,},
  {col: "DESCRIPTION", width: 600,},
]

const PolicyTemplatesModal: React.FC<PolicyTemplatesModalProps> = ({
  isOpen,
  onClose,
  handleSelectPolicyTemplate
}) => {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleClose = () => {
    onClose();
  };

  const handleRowClick = useCallback(
    (riskId: number) => {
      setSelectedId(selectedId === riskId ? null : riskId);
    },
    [selectedId],
  );

  const handleSubmit = () => {
    if (selectedId) {
      const selectedPolicy = policies.find((policy) => policy.id === selectedId);
      if (selectedPolicy) {
        const template: PolicyTemplate = {
          title: selectedPolicy.title,
          tags: selectedPolicy.tags,
          content: selectedPolicy.content
        }
        handleSelectPolicyTemplate(template);
        onClose();
      }
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a new policy"
      description="Select a policy from the template"
      onSubmit={handleSubmit}
      submitButtonText="Use selected policy and edit"
      isSubmitting={!selectedId}
      maxWidth="1500px"
    >
      <Stack spacing={6}>
        <Stack
          sx={{
            maxHeight: "50vh",
            overflow: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {TITLE_OF_COLUMNS.map((column) => (
                    <TableCell
                      key={column.col}
                      sx={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: theme.palette.text.secondary,
                        bgcolor: theme.palette.grey[50],
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        minWidth: column.width
                      }}
                    >
                      {column.col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {policies.length === 0 && (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={TITLE_OF_COLUMNS.length}
                      align="center"
                      sx={{ border: "none", p: 0 }}
                    >
                      <EmptyState message="No policies found in database" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
              <TableBody>
                {policies.map((policy) => (
                  <TableRow
                    key={policy.id}
                    onClick={() => handleRowClick(policy.id)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedId === policy.id
                          ? theme.palette.action.selected
                          : "inherit",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      "&:focus": {
                        backgroundColor: theme.palette.action.focus,
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: -2,
                      },
                      verticalAlign: "initial",
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select policy: ${policy.title}`}
                  >
                    <TableCell>
                      <Radio
                        checked={selectedId === policy.id}
                        onChange={() => handleRowClick(policy.id)}
                        slotProps={{
                          input: {
                            "aria-label": `Select policy ${policy.id}: ${policy.title}`,
                          },
                        }}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{policy.id}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {policy.title}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" gap={2}>
                        {policy.tags.map((tag) => (
                          <Typography
                            variant="body2"
                            sx={{
                              borderRadius: 1,
                              bgcolor: theme.palette.info.light,
                              color: theme.palette.info.contrastText,
                              fontSize: 11,
                              fontWeight: 600,
                              textAlign: "center",
                              width: 'fit-content',
                              padding: '2px 8px'
                            }}
                          >
                            {tag}
                          </Typography>
                        ))}   
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 250,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <div 
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: policy.content }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>
    </StandardModal>
  );
};

export default PolicyTemplatesModal;
