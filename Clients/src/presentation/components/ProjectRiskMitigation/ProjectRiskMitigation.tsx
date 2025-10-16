import { Stack, Typography } from "@mui/material"
import { X as ClearIcon } from "lucide-react"
import { ProjectRiskMitigationTable } from "../Table/ProjectRiskMitigationTable/ProjectRiskMitigationTable";
import { ProjectRiskMitigation as ProjectRiskMitigationType } from "../../../domain/types/ProjectRisk";

interface ProjectRiskMitigationProps {
  onClose: () => void;
  annexCategories: ProjectRiskMitigationType[];
  subClauses: ProjectRiskMitigationType[];
  assessments: ProjectRiskMitigationType[];
  controls: ProjectRiskMitigationType[];
  annexControls_27001: ProjectRiskMitigationType[];
  subClauses_27001: ProjectRiskMitigationType[];
}

export const ProjectRiskMitigation: React.FC<ProjectRiskMitigationProps> = ({
  onClose,
  annexCategories,
  subClauses,
  assessments,
  controls,
  annexControls_27001,
  subClauses_27001
}) => {
  return (
    <Stack sx={{
      width: "100%",
      backgroundColor: "#FCFCFD",
      padding: 10,
      borderRadius: "4px",
      minHeight: "300px"
    }}>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: '100%',
        marginBottom: "20px"
      }}>
        <Typography sx={{
          fontSize: 16, 
          color: "#344054", 
          fontWeight: "bold",
        }}>Linked controls components</Typography>
        <ClearIcon
          size={20}
          style={{
            color: "#98A2B3",
            cursor: "pointer"
          }}
          onClick={onClose}
        />
      </Stack>
      <Stack>
        <ProjectRiskMitigationTable
          rows={[...subClauses, ...annexCategories, ...assessments, ...controls, ...annexControls_27001, ...subClauses_27001]}
        />
      </Stack>
    </Stack>
  )
}