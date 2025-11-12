import React, { useState } from "react";
import {
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
import EmptyState from "../../components/EmptyState";
import policyTemplates from "../../assets/PolicyTemplates.json";
import {
  PolicyTemplate,
  PolicyTemplatesProps,
} from "../../../domain/interfaces/IPolicy";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../../domain/interfaces/iAlert";

const TITLE_OF_COLUMNS = [
  { col: "ID", width: 50 },
  { col: "TITLE", width: 150 },
  { col: "TAGS", width: 250 },
  { col: "DESCRIPTION", width: 600 },
];

const PolicyTemplates: React.FC<PolicyTemplatesProps> = ({
  tags,
  fetchAll,
}) => {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicyTemplate, setSelectedPolicyTemplate] = useState<
    PolicyTemplate | undefined
  >(undefined);
  const [alert, setAlert] = useState<AlertProps | null>(null);

  const handleClose = () => {
    setShowModal(false);
    setSelectedPolicyTemplate(undefined);
  };

  const handleSelectPolicyTemplate = (id: number) => {
    setSelectedId(id);
    if (id) {
      const selectedPolicy = policyTemplates.find((policy) => policy.id === id);
      console.log(selectedPolicy);
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

  return (
    <Stack>
      <Stack spacing={6}>
        <Stack
          sx={{
            maxHeight: "75vh",
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
                        minWidth: column.width,
                      }}
                    >
                      {column.col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {policyTemplates.length === 0 && (
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
                {policyTemplates.map((policy) => (
                  <TableRow
                    key={policy.id}
                    onClick={() => handleSelectPolicyTemplate(policy.id)}
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
                              width: "fit-content",
                              padding: "2px 8px",
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
                      {policy.description}
                    </TableCell>
                    {/* <TableCell>
                      <CustomizableButton
                        variant="contained"
                        text="Use this template"
                        sx={{
                          backgroundColor: "#13715B",
                          border: "1px solid #13715B",
                          gap: 3,
                        }}
                        onClick={(e) =>
                          handleSelectPolicyTemplate(e, policy.id)
                        }
                      />
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>

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
