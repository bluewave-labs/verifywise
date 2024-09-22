import { useState } from "react";
import BasicTable from "../../../presentation/components/Table";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Checked from "../../assets/icons/check.svg";
import Exclamation from "../../assets/icons/globe.svg";
import {
  Stack,
  useTheme,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Toolbar,
  Container,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  SelectChangeEvent,
} from "@mui/material";

const complianceMetrics = [
  {
    name: "Compliance Status",
    amount: "15%",
  },
  {
    name: "Total number of controls",
    amount: "184",
  },
  {
    name: "Implemented controls",
    amount: "31",
  },
  {
    name: "Auditor completed",
    amount: "17",
  },
];

const complianceDetails = {
  cols: [
    { id: "icon", name: "" },
    { id: "CONTROLS", name: "CONTROLS" },
    { id: "OWNER", name: "OWNER" },
    { id: "SUBCONTROLS", name: "SUBCONTROLS" },
    { id: "COMPLETION", name: "COMPLETION" },
  ],
  rows: [
    {
      id: 1,
      icon: Checked,
      data: [
        {
          id: "1",
          data: "AIAct-016: Compliance with High-Risk AI System Requirements",
        },
        { id: "2", data: "Rachelle Swing" },
        { id: "3", data: "5 (2 left)" },
        { id: "4", data: "45%" },
      ],
    },
    {
      id: 2,
      icon: Checked,
      data: [
        {
          id: "1",
          data: "AIAct-017: Compliance with Union Harmonisation Legislation",
        },
        { id: "2", data: "Mike Arthurs" },
        { id: "3", data: "3 (1 left)" },
        { id: "4", data: "33%" },
      ],
    },
    {
      id: 3,
      icon: Exclamation,
      data: [
        {
          id: "1",
          data: "AIAct-018: Establish and Maintain Risk Management System for High-Risk AI Systems",
        },
        { id: "2", data: "John B" },
        { id: "3", data: "5 (all completed)" },
        { id: "4", data: "55%" },
      ],
    },
    {
      id: 4,
      icon: Checked,
      data: [
        {
          id: "1",
          data: "AIAct-020: Identify and Analyze Known and Foreseeable Risks",
        },
        { id: "2", data: "Adam Gwen" },
        { id: "3", data: "4 (2 left)" },
        { id: "4", data: "70%" },
      ],
    },
  ],
};

const Compliance = () => {
  const theme = useTheme();
  const { spacing, shape, palette } = theme;
  const [dropDown, setDropDown] = useState("ChatBot AI");
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => {
    return (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  };

  const handleDropDownChange = (event: SelectChangeEvent<string>) => {
    setDropDown(event.target.value as string);
  };

  const renderAccordion = (id: string, title: string, content: any) => (
    <Accordion
      expanded={expanded === id}
      onChange={handleAccordionChange(id)}
      sx={{
        mt: 18,
        border: "2px solid",
        borderColor: "#eaecf0",
        width: "970px",
        marginLeft: "6px",
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",
        position: "relative",
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
          padding: theme.spacing(5),
          flexDirection: "row-reverse",
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "16px", paddingLeft: "10px" }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
  );

  return (
    <Container
      sx={{
        mt: 1,
        ml: 15,
        mr: -20 /* border:"2px, solid" , borderColor:"red"*/,
      }}
    >
      <Stack component="section">
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: 2,
            position: "absolute",
            top: 60,
            right: 0,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "13px", mr: 6 }}>
            Currently viewing project:
          </Typography>
          <FormControl>
            <Select
              value={dropDown}
              onChange={handleDropDownChange}
              displayEmpty
              sx={{
                fontSize: "13px",
                boxShadow: "0px 1px rgba(0, 0, 0, 0.1)",
                minWidth: 144,
                height: 34,
                borderRadius: (theme) => shape.borderRadius,
              }}
            >
              <MenuItem value="ChatBot AI">ChatBot AI</MenuItem>
              {/* add more dropDown options here */}
            </Select>
          </FormControl>
        </Box>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              position: "absolute",
              top: 80,
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
            gap: spacing(10),
            mt: 32,
            paddingLeft: "6px",
          }}
        >
          {complianceMetrics.map((item) => (
            <Box
              key={item.name}
              sx={{
                width: "224.21px",
                height: "64px",
                borderRadius: shape.borderRadius,
                backgroundColor: palette.background.paper,
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                justifyContent: "center",
                padding: spacing(2),
                paddingLeft: "13px",
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
                  mt: 1,
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
        <Box sx={{ mt: "30px" }}>

          {renderAccordion(
            "panel1",
            "1.1 Compliance with Requirements for High-Risk AI Systems",
            <BasicTable
              data={complianceDetails}
              paginated={false}
              reversed={false}
              table="complianceTable"
            />
          )}
          {renderAccordion(
            "panel2",
            "1.2 Transparency Obligations for Providers and Deployers of Certain AI Systems",
            <BasicTable
              data={complianceDetails}
              paginated={false}
              reversed={false}
              table="complianceTable"
            />
          )}
        </Box>
      </Stack>
    </Container>
  );
};

export default Compliance;
