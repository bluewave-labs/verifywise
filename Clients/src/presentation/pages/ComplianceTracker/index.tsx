import { useState } from "react";
import BasicTable from "../../../presentation/components/Table";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CustomModal from "../../components/Modals/Controlpane";
import {
  Stack,
  useTheme,
  Box,
  Typography,
  Toolbar,
  Container,
  AccordionSummary,
  Accordion,
  AccordionDetails,
} from "@mui/material";
import {
  complianceMetrics as metricData,
  complianceDetails as detailsData,
} from "../../mocks/compliance.data";

const Compliance = ({
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

  const selectedRowData = complianceDetails.rows.find(
    (row: any) => row.id === selectedRow
  );

  const acdSumDetails = [
    {
      summaryId: "panel1",
      summaryTitle: "1.1 Compliance with Requirements for High-Risk AI Systems",
    },
    {
      summaryId: "panel2",
      summaryTitle:
        "1.2 Transparency Obligations for Providers and Deployers of Certain AI Systems",
    },
  ];

  const handleAccordionChange = (panel: string) => {
    return (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  };

  const handleRowClick = (id: number) => {
    setSelectedRow(id);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    console.log("Confirmed action for row:", selectedRow);
    setIsModalOpen(false); 
  };

  const renderAccordion = (id: string, title: string, content: any) => (
    <Box sx={{marginBottom: 10}}>
      <Accordion
        expanded={expanded === id}
        onChange={handleAccordionChange(id)}
        sx={{
          mt: spacing(4.5),
          border: "2px solid",
          borderColor: "#eaecf0",
          width: "100%",
          marginLeft: spacing(0.75),
          borderRadius: theme.shape.borderRadius,
          overflow: "hidden",
          position: "relative",
      
          "&.MuiPaper-root": {
            margin: 0,
            padding: 0,
            boxShadow: "none",
          },
          "& .MuiAccordionDetails-root": {
            padding: 0,
            margin: 0,
          },
          "& .css-11dq6i3-MuiPaper-root-MuiTableContainer-root":{
            marginTop: 0,
          }
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon
              sx={{
                transform: expanded === id ? "rotate(180deg)" : "rotate(270deg)",
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
            height: '',
            "& .MuiAccordionSummary-content":{
              marginTop: '12px',
              marginBottom: '12px',
            }
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: "16px", paddingLeft: spacing(1.25) }}
          >
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails
        sx={{
          "& .css-5s768i-MuiTable-root": {
            border: "none",
            borderRadius : '0',
          },
          "& .css-11dq6i3-MuiPaper-root-MuiTableContainer-root": {
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            borderRadius: "0",
          }
        }}
        >{content}</AccordionDetails>
      </Accordion>
    </Box>
  );

  return (
    <Container
      sx={{
        mt: spacing(1),
        ml: spacing(3.75),
        fontFamily: "Inter",
      }}
    >
      <Stack component="section">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              position: "absolute",
              top: spacing(2.5),
              fontSize: "18px",
              fontWeight: 600,
              color: "#1A1919",
            }}
          >
            Compliance tracker
          </Typography>
        </Toolbar>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            gap: spacing(20),
            mt: spacing(1),
            paddingLeft: spacing(0.75),
            "& .MuiAccordion-root": {
              boxShadow: "none", // No shadow effect
            },
            "& .MuiAccordion-root.Mui-expanded": {
              margin: 0,
              padding: 0, // Prevent margin movement
            },
          }}
        >
          {complianceMetrics.map((item: any) => (
            <Box
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
                border: "2px solid",
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
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: spacing(7.5),
          }}
        >
          {renderAccordion(
            acdSumDetails[0].summaryId,
            acdSumDetails[0].summaryTitle,
            <BasicTable
              data={complianceDetails}
              paginated={false}
              reversed={false}
              table="complianceTable"
              onRowClick={handleRowClick}
            />
          )}
          {renderAccordion(
            acdSumDetails[1].summaryId,
            acdSumDetails[1].summaryTitle,
            <BasicTable
              data={complianceDetails}
              paginated={false}
              reversed={false}
              table="complianceTable"
              onRowClick={handleRowClick}
            />
          )}
        </Box>
        {/* Render the modal and pass the state */}
        {selectedRow !== null && (
          <CustomModal
            isOpen={isModalOpen}
            setIsOpen={setIsModalOpen}
            title={
              selectedRowData ? selectedRowData.data[0].data : "Row not found"
            }
            content={`This is some dynamic content for row ${selectedRow}.`}
            onConfirm={handleConfirm}
          />
        )}
      </Stack>
    </Container>
  );
};

export default Compliance;
