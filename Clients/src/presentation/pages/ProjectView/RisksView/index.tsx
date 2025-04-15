/**
 * This file is currently in use
 */

import { Stack, Typography, Box } from "@mui/material";
import { RiskData } from "./riskkViewValues";
import {
  FC,
  useState,
  useMemo,
  useCallback,
  memo,
  lazy,
  Suspense,
  useEffect,  
} from "react";
import BasicTable from "../../../components/Table";
import Risks from "../../../components/Risks";
import AddNewRiskForm from "../../../components/AddNewRiskForm";
import Popup from "../../../components/Popup";
import AddNewVendorRiskForm from "../../../components/AddNewVendorRiskForm";
import { ProjectRisk } from "../../../../application/hooks/useProjectRisks";

import { getAllEntities } from "../../../../application/repository/entity.repository";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { VendorRisk } from "../../../../domain/VendorRisk";

const Alert = lazy(() => import("../../../components/Alert"));

const projectRisksColNames = [
  {
    id: "risk_name",
    name: "RISK NAME",
  },
  {
    id: "impact",
    name: "IMPACT",
  },
  {
    id: "risk_owner",
    name: "OWNER",
  },
  {
    id: "severity",
    name: "SEVERITY",
  },
  {
    id: "likelihood",
    name: "LIKELIHOOD",
  },
  {
    id: "risk_level_autocalculated",
    name: "RISK LEVEL",
  },
  {
    id: "mitigation_status",
    name: "MITIGATION",
  },
  {
    id: "final_risk_level",
    name: "FINAL RISK LEVEL",
  },
];
interface RisksViewProps {
  risksSummary: RiskData;
  risksData: ProjectRisk[] | VendorRisk[];
  title: string;
  projectId: string;
}

const vendorRisksColNames = [
  { id: "vendor_name", name: "VENDOR NAME" },
  { id: "risk_name", name: "RISK NAME" },
  { id: "owner", name: "OWNER" },
  // { id: "risk_level", name: "RISK LEVEL" },
  { id: "review_date", name: "REVIEW DATE" },
];

/**
 * Main component for displaying project or vendor risks view
 * @param risksSummary Summary data for risks visualization
 * @param risksData Array of project or vendor risks
 * @param title Type of risks being displayed ("Project" or "Vendor")
 */

const RisksView: FC<RisksViewProps> = memo(
  ({ risksSummary, risksData, title, projectId }) => {
    /**
     * Determines which column set to use based on risk type
     */
    const risksTableCols = useMemo(() => {
      if (title === "Project") {
        return projectRisksColNames;
      } else {
        return vendorRisksColNames;
      }
    }, [title, vendorRisksColNames]);

    /**
     * Transforms risk data into table row format
     * Handles special formatting for dates and ensures data matches column structure
     */
    const risksTableRows = useMemo(() => {
      return risksData.reduce<
        { id: string; data: { id: string; data: any }[] }[]
      >((acc, item, i) => {
        const rowData = risksTableCols.map((col) => {
          const value = (item as any)[col.id];
          let displayValue = value;
          if (col.id === "review_date" && value) {
            displayValue = new Date(value).toLocaleDateString();
          }

          return {
            id: `${col.id}_${i}`,
            data: String(displayValue || ""),
          };
        });

        acc.push({
          id: `${(item as ProjectRisk | VendorRisk).risk_description}_${i}`,
          data: rowData,
        });

        return acc;
      }, []);
    }, [risksData, risksTableCols]);

    /**
     * Combines columns and rows data for table component
     */
    const tableData = useMemo(
      () => ({
        cols: risksTableCols,
        rows: risksTableRows,
      }),
      [risksTableCols, risksTableRows]
    );

    console.log("tableData", tableData);

    const [selectedRow, setSelectedRow] = useState<ProjectRisk>();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [riskData1, setRiskData] = useState<ProjectRisk[] | VendorRisk[]>([]);

    const [alert, setAlert] = useState<{
      variant: "success" | "info" | "warning" | "error";
      title?: string;
      body: string;
    } | null>(null);

    /**
     * Handles closing the risk edit popup
     */
    const handleClosePopup = () => {
      setAnchorEl(null); // Close the popup

      setSelectedRow(undefined);
    };

    const handleSuccess = () => {
      console.log("create vendor is success!");
      handleAlert({
        variant: "success",
        body: title + " risk created successfully",
        setAlert,
      });

      fetchRiskData();
    };

    const handleUpdate = () => {
      handleAlert({
        variant: "success",
        body: title + " risk updated successfully",
        setAlert,
      });

      fetchRiskData();
    };

    const fetchRiskData = useCallback(async () => {
      try {
        const url =
          title === "Project"
            ? `/projectRisks/by-projid/${projectId}`
            : `/vendorRisks/by-projid/${projectId}`;
        const response = await getAllEntities({ routeUrl: url });
        console.log("response :::: > ", response);
        setRiskData(response.data);
      } catch (error) {
        console.error("Error fetching vendor risks:", error);
      }
    }, []);

    useEffect(() => {
      fetchRiskData();
    }, [title]);

    /**
     * Renders the "Add New Risk" popup component for project risks
     */
    const AddNewRiskPopupRender = useCallback(() => {
      const [anchor, setAnchor] = useState<null | HTMLElement>(null);
      const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
      };

      return (
        <Popup
          popupId="add-new-risk-popup"
          popupContent={
            <AddNewRiskForm
              closePopup={() => setAnchor(null)}
              popupStatus="new"
              onSuccess={handleSuccess}
            />
          }
          openPopupButtonName="Add new risk"
          popupTitle="Add a new risk"
          popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
        />
      );
    }, []);

    /**
     * Renders the "Add New Vendor Risk" popup component
     */
    const AddNewVendorRiskPopupRender = useCallback(() => {
      const [anchor, setAnchor] = useState<null | HTMLElement>(null);
      const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
      };

      return (
        <Popup
          popupId="add-new-vendor-risk-popup"
          popupContent={
            <AddNewVendorRiskForm
              closePopup={() => setAnchor(null)}
              onSuccess={handleSuccess}
              popupStatus="new"
            />
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
        {alert && (
          <Suspense fallback={<div>Loading...</div>}>
            <Box>
              <Alert
                variant={alert.variant}
                title={alert.title}
                body={alert.body}
                isToast={true}
                onClick={() => setAlert(null)}
              />
            </Box>
          </Suspense>
        )}
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

        {Object.keys(selectedRow || {}).length > 0 &&
          anchorEl &&
          title === "Project" && (
            <Popup
              popupId="edit-new-risk-popup"
              popupContent={
                <AddNewRiskForm
                  closePopup={() => setAnchorEl(null)}
                  popupStatus="edit"
                  onSuccess={handleUpdate}
                />
              }
              openPopupButtonName="Edit risk"
              popupTitle="Edit project risk"
              handleOpenOrClose={handleClosePopup}
              anchor={anchorEl}
            />
          )}

        {Object.keys(selectedRow || {}).length > 0 &&
          anchorEl &&
          title === "Vendor" && (
            <Popup
              popupId="edit-vendor-risk-popup"
              popupContent={
                <AddNewVendorRiskForm
                  closePopup={() => setAnchorEl(null)}
                  onSuccess={handleUpdate}
                  popupStatus="edit"
                />
              }
              openPopupButtonName="Edit risk"
              popupTitle="Edit vendor risk"
              handleOpenOrClose={handleClosePopup}
              anchor={anchorEl}
            />
          )}

        {/* map the data */}
        <BasicTable
          data={tableData}
          bodyData={riskData1}
          table="risksTable"
          paginated
          label={`${title} risk`}
          setSelectedRow={(row) => setSelectedRow(row as ProjectRisk)}
          setAnchorEl={setAnchorEl}
        />
      </Stack>
    );
  }
);

export default RisksView;
