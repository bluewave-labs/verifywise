import { useContext, useEffect, useState } from "react";
import BasicTable from "../../../presentation/components/Table";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CustomModal from "../../components/Modals/Controlpane";
import {
  Stack,
  useTheme,
  Box,
  Typography,
  Toolbar,
  AccordionSummary,
  Accordion,
  AccordionDetails,
} from "@mui/material";
import {
  complianceMetrics as metricData,
  complianceDetails as detailsData,
} from "../../mocks/compliance.data";
import { getAllEntities } from "../../../application/repository/entity.repository";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";

interface RowData {
  id: number;
  icon: string;
  data: Array<{ id: string; data: string }>;
}

const acdSumDetails = [
  { summaryId: "panel1", summaryTitle: "AI literacy" },
  {
    summaryId: "panel2",
    summaryTitle: "Transparency and provision of information to deployers",
  },
  { summaryId: "panel3", summaryTitle: "Human oversight" },
  {
    summaryId: "panel4",
    summaryTitle: "Corrective actions and duty of information",
  },
  {
    summaryId: "panel5",
    summaryTitle: "Responsibilities along the AI value chain",
  },
  {
    summaryId: "panel6",
    summaryTitle: "Obligations of deployers of high-risk AI systems",
  },
  {
    summaryId: "panel7",
    summaryTitle:
      "Fundamental rights impact assessments for high-risk AI systems",
  },
  {
    summaryId: "panel8",
    summaryTitle:
      "Transparency obligations for providers and users of certain AI systems",
  },
  { summaryId: "panel9", summaryTitle: "Registration" },
  {
    summaryId: "panel10",
    summaryTitle: "EU database for high-risk AI systems listed in Annex III",
  },
  {
    summaryId: "panel11",
    summaryTitle:
      "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
  },
  { summaryId: "panel12", summaryTitle: "Reporting of serious incidents" },
  { summaryId: "panel13", summaryTitle: "General-purpose AI models" },
];

const ComplianceTracker = ({
  complianceMetrics = metricData,
  complianceDetails = detailsData,
}: any) => {
  const theme = useTheme();
  const { spacing, shape, palette } = theme;

  // State to manage accordion expansion
  const [expanded, setExpanded] = useState<string | false>(false);

  // State to manage modal open/close
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State to manage the selected row for modal content
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const { setDashboardValues } = useContext(VerifyWiseContext);

  const fetchComplianceTracker = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/complianceLists" });
      console.log("Response:", response);
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        compliance: response.data,
      }));
    } catch (error) {
      console.error("Error fetching compliance tracker:", error);
    }
  };

  useEffect(() => {
    fetchComplianceTracker();
  }, []);

  // Function to handle accordion toggle
  const handleAccordionChange = (panel: string) => {
    return (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  };

  // Handle row click to open modal with selected row data
  const handleRowClick = (id: number) => {
    setSelectedRow(id);
    setIsModalOpen(true);
  };

  const renderAccordion = (id: string, title: string) => {
    // Get the specific section data for the current accordion title
    const sectionData = complianceDetails[title];
    console.log("🚀 ~ renderAccordion ~ sectionDataaaaaaa:", sectionData)
    

    if (!sectionData) {
      return <div>No data available for this section</div>;
    }

    const { cols, rows } = sectionData;

    return (
      <Box key={id}>
        <Accordion
          expanded={expanded === id}
          onChange={handleAccordionChange(id)}
          sx={{
            mt: spacing(4.5),
            border: "1px solid",
            borderColor: "#eaecf0",
            width: "100%",
            marginLeft: spacing(0.75),
            borderRadius: theme.shape.borderRadius,
            overflow: "hidden",
            position: "relative",
            "&.MuiPaper-root": { margin: 0, padding: 0, boxShadow: "none" },
            "& .MuiAccordionDetails-root": { padding: 0, margin: 0 },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  transform:
                    expanded === id ? "rotate(180deg)" : "rotate(270deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            }
            aria-controls={`${id}-content`}
            id={`${id}-header`}
            sx={{
              bgcolor: "#FAFAFA",
              padding: spacing(5),
              flexDirection: "row-reverse",
              height: 64,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "16px", paddingLeft: spacing(1.25) }}
            >
              {title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <BasicTable
              data={{ cols, rows }}
              paginated={false}
              reversed={false}
              table="complianceTable"
              onRowClick={handleRowClick}
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Stack className="compliance-page">
      <Toolbar>
        <Typography
          sx={{
            flexGrow: 1,
            position: "absolute",
            top: spacing(2.5),
            fontSize: "18px",
            fontWeight: 600,
            color: "#1A1919",
          }}
        >
          Compliance Tracker
        </Typography>
      </Toolbar>
      <Stack
        sx={{
          maxWidth: 1400,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          gap: spacing(10),
          paddingLeft: spacing(0.75),
        }}
      >
        {complianceMetrics.map((item: any) => (
          <Stack
            key={item.name}
            sx={{
              width: "30%",
              height: spacing(32),
              borderRadius: shape.borderRadius,
              backgroundColor: palette.background.paper,
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              justifyContent: "center",
              padding: spacing(2),
              paddingLeft: spacing(6),
              textAlign: "end",
              border: "1px solid",
              borderColor: "#EAECF0",
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontSize: "12px", fontWeight: 400, color: "#8594AC" }}
            >
              {item.name}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mt: spacing(1),
                fontSize: "16px",
                fontWeight: 600,
                color: "#2D3748",
              }}
            >
              {item.amount}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Stack
        sx={{
          maxWidth: 1400,
          mt: spacing(7.5),
          gap: theme.spacing(10),
        }}
      >
        {acdSumDetails.map((acdSumDetail: any) =>
          renderAccordion(acdSumDetail.summaryId, acdSumDetail.summaryTitle)
        )}
      </Stack>
      {selectedRow !== null && (
        <CustomModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          title={Object.keys(complianceDetails).map((key) => {
            const item = complianceDetails[key];
            return item.rows.find((row: any) => row.id === selectedRow)?.data[0]
              ?.data;
          })}
          content={Object.keys(complianceDetails).map((key) => {
            const item = complianceDetails[key];
            return item.rows.find((row: any) => row.id === selectedRow)?.data[0]
              ?.controlDes;
          })}
          onConfirm={() => {
            console.log("confirmed");
          }}
        />
      )}
    </Stack>
  );
};

export default ComplianceTracker;
