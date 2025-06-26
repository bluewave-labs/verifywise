import { useState } from "react";
import {
  Modal,
  Stack,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import riskData from "../../assets/MITAIRISKDB.json";

const TITLE_OF_COLUMNS = [
  "",
  "ID",
  "RISK NAME",
  "DESCRIPTION",
  "SEVERITY",
  "LIKELIHOOD",
  "CATEGORY",
];

const AddNewRiskMITModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filteredRisks = riskData.filter(
    (risk) =>
      risk.Summary.toLowerCase().includes(search.toLowerCase()) ||
      risk["Risk Category"].toLowerCase().includes(search.toLowerCase()) ||
      risk.Description.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
    setSelectedId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Stack
        gap={theme.spacing(4)}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1000,
          bgcolor: "#FFFFFF",
          p: 10,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#000000" }}>
            Add a new risk from risk database
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
          sx={{ mb: theme.spacing(4) }}
        >
          <Typography
            sx={{ fontSize: 13, fontWeight: 400, color: "#344054", mr: 4 }}
          >
            Search from the risk database:
          </Typography>
          <TextField
            size="small"
            value={search}
            onChange={handleSearchChange}
            sx={{
              width: 350,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderRadius: 2,
                },
                "&:hover fieldset": {
                  borderRadius: 2,
                },
                "&.Mui-focused fieldset": {
                  borderRadius: 2,
                },
              },
            }}
          />
        </Stack>
        <Stack sx={{ maxHeight: "50vh", overflow: "auto" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {TITLE_OF_COLUMNS.map((column) => (
                  <TableCell
                    key={column}
                    style={{ fontSize: 13, fontWeight: 400, color: "#667085" }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            {filteredRisks.length === 0 && (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={TITLE_OF_COLUMNS.length}
                    align="center"
                    style={{
                      padding: theme.spacing(15, 5),
                      paddingBottom: theme.spacing(20),
                    }}
                  >
                    <img src={placeholderImage} alt="Placeholder" />
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 400, color: "#344054" }}
                    >
                      No risks found in database
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
            <TableBody>
              {filteredRisks.map((risk) => (
                <TableRow
                  key={risk.Id}
                  onClick={() =>
                    setSelectedId(selectedId === risk.Id ? null : risk.Id)
                  }
                  sx={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedId === risk.Id
                        ? theme.palette.action.selected
                        : "inherit",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>
                    <Radio
                      checked={selectedId === risk.Id}
                      onChange={() =>
                        setSelectedId(selectedId === risk.Id ? null : risk.Id)
                      }
                    />
                  </TableCell>
                  <TableCell>{risk.Id}</TableCell>
                  <TableCell>{risk.Summary}</TableCell>
                  <TableCell>{risk.Description}</TableCell>
                  <TableCell>{risk["Risk Severity"]}</TableCell>
                  <TableCell>{risk.Likelihood}</TableCell>
                  <TableCell>{risk["Risk Category"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" mt={4}>
          <Button
            variant="contained"
            sx={{ fontWeight: 400, fontSize: 13, backgroundColor: "#13715B" }}
            onClick={() => {}}
            disabled={selectedId === null}
          >
            Use selected risk and edit
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default AddNewRiskMITModal;
