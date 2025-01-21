import { Stack, Typography } from "@mui/material";
import { RiskData } from "../../../mocks/projects/project-overview.data";
import { FC, useState, useMemo, useCallback, memo } from "react";
import { VendorRisk } from "../../../mocks/projects/project-vendor-risks.data";
import BasicTable from "../../../components/Table";
import Risks from "../../../components/Risks";
import AddNewRiskForm from "../../../components/AddNewRiskForm";
import Popup from "../../../components/Popup";
import AddNewVendorRiskForm from "../../../components/AddNewVendorRiskForm";
import { ProjectRisk } from "../../../../application/hooks/useProjectRisks";

const projectRisksColNames = [
  {
      "id": "risk_name",
      "name": "RISK NAME"
  },
  {
      "id": "impact",
      "name": "IMPACT"
  },
  {
      "id": "risk_owner",
      "name": "OWNER"
  },
  {
      "id": "severity",
      "name": "SEVERITY"
  },
  {
      "id": "likelihood",
      "name": "LIKELIHOOD"
  },
  {
      "id": "risk_level_autocalculated",
      "name": "RISK LEVEL"
  },
  {
      "id": "mitigation_status",
      "name": "MITIGATION"
  },
  {
      "id": "final_risk_level",
      "name": "FINAL RISK LEVEL"
  }
]
interface RisksViewProps {
  risksSummary: RiskData;
  risksData: ProjectRisk[] | VendorRisk[];
  title: string;
}

const RisksView: FC<RisksViewProps> = memo(
  ({ risksSummary, risksData, title }) => {

    const vendorRisksColNames = useMemo(
      () => ["VENDOR NAME", "RISK NAME", "OWNER", "RISK LEVEL", "REVIEW DATE"],
      []
    );

    const colNames = useMemo(() => {
      return title === "Project"
        ? projectRisksColNames
        : title === "Vendor"
        ? vendorRisksColNames
        : [];
    }, [title, vendorRisksColNames]);

    const risksTableCols = useMemo(() => {
      if (title === "Project") {
        return projectRisksColNames;
      } else {
        return colNames.reduce<{ id: string; name: string }[]>((acc, item, i) => {
          acc.push({
            id: Object.keys(risksData[0])[i],
            name: typeof item === 'string' ? item : item.name,
          });
          return acc;
        }, []);
      }
    }, [colNames, risksData, title]);

    const risksTableRows = useMemo(() => {
      return risksData.reduce<
        { id: string; data: { id: string; data: string | number }[] }[]
      >((acc, item, i) => {
        const rowData = Object.keys(item).map((key, indexKey) => {
          const typedKey = key as keyof (ProjectRisk | VendorRisk);
          if (risksTableCols.some(col => col.id === key)) {
            return {
              id: `${key}_${i}_${indexKey}`,
              data: String(item[typedKey]),
            };
          }
        });

        const filteredRowData = rowData.filter((row): row is { id: string; data: string } => row !== undefined);

        acc.push({
          id: `${'risk_name' in item ? item.risk_name : item.riskName}_${i}`,
          data: filteredRowData,
        });

        return acc;
      }, []);
    }, [risksData, risksTableCols]);

    const tableData = useMemo(
      () => ({
        cols: risksTableCols,
        rows: risksTableRows,
      }),
      [risksTableCols, risksTableRows]
    );

    const [selectedRow, setSelectedRow] = useState({});
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClosePopup = () => {
      setAnchorEl(null); // Close the popup
      setSelectedRow({});
    };

    const AddNewRiskPopupRender = useCallback(() => {
      const [anchor, setAnchor] = useState<null | HTMLElement>(null);
      const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
      };

      return (
        <Popup
          popupId="add-new-risk-popup"
          popupContent={<AddNewRiskForm closePopup={() => setAnchor(null)} popupStatus="new" />}
          openPopupButtonName="Add new risk"
          popupTitle="Add a new risk"
          popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
        />
      );
    }, []);

    const AddNewVendorRiskPopupRender = useCallback(() => {
      const [anchor, setAnchor] = useState<null | HTMLElement>(null);
      const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
      };

      return (
        <Popup
          popupId="add-new-vendor-risk-popup"
          popupContent={
            <AddNewVendorRiskForm closePopup={() => setAnchor(null)} />
          }
          openPopupButtonName="Add new risk"
          popupTitle="Add a new vendor risk"
          popupSubtitle="Create a list of vendor risks"
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
        />
      );
    }, []);

    return (
      <Stack sx={{ maxWidth: 1220 }}>
        <Risks {...risksSummary} />
        <Stack
          sx={{ mt: "32px", mb: "28px" }}
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <Typography
            component="h2"
            sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}
          >
            {title} risks
          </Typography>
          {title === "Project" ? (
            <AddNewRiskPopupRender />
          ) : (
            <AddNewVendorRiskPopupRender />
          )}
        </Stack>
        {Object.keys(selectedRow).length > 0 && anchorEl && (
          <Popup
            popupId="edit-new-risk-popup"
            popupContent={<AddNewRiskForm closePopup={() => setAnchorEl(null)} popupStatus="edit" />}
            openPopupButtonName="Edit risk"
            popupTitle="Edit project risk"
            // popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
            handleOpenOrClose={handleClosePopup}
            anchor={anchorEl}
          />
        )}
        <BasicTable
          data={tableData}
          table="risksTable"
          paginated
          label={`${title} risk`}
          setSelectedRow={setSelectedRow}
          setAnchorEl={setAnchorEl}
        />
      </Stack>
    );
  }
);

export default RisksView;
