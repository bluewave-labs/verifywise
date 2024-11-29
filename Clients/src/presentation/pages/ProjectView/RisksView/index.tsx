import { Stack, Typography } from "@mui/material";
import { RiskData } from "../../../mocks/projects/project-overview.data";
import { ProjectRisk } from "../../../mocks/projects/project-risks.data";
import { FC, useState, useMemo, useCallback, memo } from "react";
import { VendorRisk } from "../../../mocks/projects/project-vendor-risks.data";
import BasicTable from "../../../components/Table";
import Risks from "../../../components/Risks";
import AddNewRiskForm from "../../../components/AddNewRiskForm";
import Popup from "../../../components/Popup";
import AddNewVendorRiskForm from "../../../components/AddNewVendorRiskForm";

interface RisksViewProps {
  risksSummary: RiskData;
  risksData: ProjectRisk[] | VendorRisk[];
  title: string;
}

const RisksView: FC<RisksViewProps> = memo(
  ({ risksSummary, risksData, title }) => {
    const projectRisksColNames = useMemo(
      () => [
        "RISK NAME",
        "IMPACT",
        "OWNER",
        "SEVERITY",
        "LIKELIHOOD",
        "RISK LEVEL",
        "MITIGATION",
        "FINAL RISK LEVEL",
      ],
      []
    );

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
    }, [title, projectRisksColNames, vendorRisksColNames]);

    const risksTableCols = useMemo(() => {
      return colNames.reduce<{ id: string; name: string }[]>((acc, item, i) => {
        acc.push({
          id: Object.keys(risksData[0])[i],
          name: item,
        });
        return acc;
      }, []);
    }, [colNames, risksData]);

    const risksTableRows = useMemo(() => {
      return risksData.reduce<
        { id: string; data: { id: string; data: string | number }[] }[]
      >((acc, item, i) => {
        const rowData = Object.keys(item).map((key, indexKey) => {
          const typedKey = key as keyof (ProjectRisk | VendorRisk);
          return {
            id: `${key}_${i}_${indexKey}`,
            data: item[typedKey],
          };
        });

        acc.push({
          id: `${item.riskName}_${i}`,
          data: rowData,
        });

        return acc;
      }, []);
    }, [risksData]);

    const tableData = useMemo(
      () => ({
        cols: risksTableCols,
        rows: risksTableRows,
      }),
      [risksTableCols, risksTableRows]
    );

    const AddNewRiskPopupRender = useCallback(() => {
      const [anchor, setAnchor] = useState<null | HTMLElement>(null);
      const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
      };

      return (
        <Popup
          popupId="add-new-risk-popup"
          popupContent={<AddNewRiskForm closePopup={() => setAnchor(null)} />}
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
        <BasicTable
          data={tableData}
          table="risksTable"
          paginated
          label={`${title} risks`}
        />
      </Stack>
    );
  }
);

export default RisksView;
