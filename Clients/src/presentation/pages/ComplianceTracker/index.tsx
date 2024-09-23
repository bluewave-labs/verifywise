import { useState } from "react";
import BasicTable from "../../../presentation/components/Table";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

const Compliance = ({ complianceMetrics, complianceDetails }: any) => {
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
        mt: spacing(4.5), 
        border: "2px solid",
        borderColor: "#eaecf0",
        width: "100%", 
        marginLeft: spacing(0.75),
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",
        position: "relative",
        "& .MuiAccordionDetails-root": {
          padding: 0,
        },
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
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "16px", paddingLeft: spacing(1.25) }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: spacing(2),
            mt: spacing(4.25),
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "13px", mr: spacing(1.5) }}>
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
                height: spacing(17), 
                borderRadius: shape.borderRadius,
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
            gap: spacing(18), 
            mt: spacing(1),
            paddingLeft: spacing(0.75),
          }}
        >
          {complianceMetrics.map((item: any) => (
            <Box
              key={item.name}
              sx={{
                width: "20%", 
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
        {/* <SubControl /> */}
      </Stack>
    </Container>
  );
};

export default Compliance;
