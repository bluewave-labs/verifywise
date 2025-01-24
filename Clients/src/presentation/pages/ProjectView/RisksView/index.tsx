import { Stack, Typography } from "@mui/material";
import { RiskData } from "../../../mocks/projects/project-overview.data";
import { FC, useState, useMemo, useCallback, memo } from "react";
import BasicTable from "../../../components/Table";
import Risks from "../../../components/Risks";
import AddNewRiskForm from "../../../components/AddNewRiskForm";
import Popup from "../../../components/Popup";
import AddNewVendorRiskForm from "../../../components/AddNewVendorRiskForm";
import { ProjectRisk } from "../../../../application/hooks/useProjectRisks";
import { VendorRisk } from "../../../../application/hooks/usevendorRisks";

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

const vendorRisksColNames = [
	{ id: "vendor_name", name: "VENDOR NAME" },
	{ id: "risk_name", name: "RISK NAME" },
	{ id: "owner", name: "OWNER" },
	{ id: "risk_level", name: "RISK LEVEL" },
	{ id: "review_date", name: "REVIEW DATE" }
];

/**
 * Main component for displaying project or vendor risks view
 * @param risksSummary Summary data for risks visualization
 * @param risksData Array of project or vendor risks
 * @param title Type of risks being displayed ("Project" or "Vendor")
 */

const RisksView: FC<RisksViewProps> = memo(
	({ risksSummary, risksData, title }) => {



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
				{ id: string; data: { id: string; data: string | number }[] }[]
			>((acc, item, i) => {
				const rowData = risksTableCols.map(col => {
					const value = (item as any)[col.id];
					let displayValue = value;

					if (col.id === 'review_date' && value) {
						displayValue = new Date(value).toLocaleDateString();
					}

					return {
						id: `${col.id}_${i}`,
						data: String(displayValue || ''),
					};
				});

				acc.push({
					id: `${(item as ProjectRisk | VendorRisk).risk_name}_${i}`,
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

		const [selectedRow, setSelectedRow] = useState({});
		const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

		/**
		 * Handles closing the risk edit popup
		 */
		const handleClosePopup = () => {
			setAnchorEl(null); // Close the popup
			setSelectedRow({});
		};

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
					popupContent={<AddNewRiskForm closePopup={() => setAnchor(null)} popupStatus="new" />}
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
