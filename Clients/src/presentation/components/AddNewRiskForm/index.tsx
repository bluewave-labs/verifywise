import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Stack, Tab, useTheme } from "@mui/material";
import { FC, useState, useCallback, useMemo, lazy, Suspense } from "react";
import "./styles.css";

const RiskSection = lazy(() => import("./RisksSection"));
const MitigationSection = lazy(() => import("./MitigationSection"));

interface AddNewRiskFormProps {
    closePopup: () => void;
}

const AddNewRiskForm: FC<AddNewRiskFormProps> = ({ closePopup }) => {
    const theme = useTheme();
    const disableRipple = theme.components?.MuiButton?.defaultProps?.disableRipple;

    const [value, setValue] = useState("risks");
    const handleChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    }, []);

    const tabStyle = useMemo(() => ({
        textTransform: "none",
        fontWeight: 400,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "16px 0 7px",
        minHeight: "20px"
    }), []);

    return (
        <Stack>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={handleChange} aria-label="Add new risk tabs"
                        sx={{
                            minHeight: "20px",
                            "& .MuiTabs-flexContainer": { columnGap: "34px" }
                        }}
                    >
                        <Tab label="Risks" value="risks" sx={tabStyle} disableRipple={disableRipple} />
                        <Tab label="Mitigation" value="mitigation" sx={tabStyle} disableRipple={disableRipple} />
                    </TabList>
                </Box>
                <Suspense fallback={<div>Loading...</div>}>
                    <TabPanel value="risks" sx={{ p: "24px 0 0" }}><RiskSection closePopup={closePopup} /></TabPanel>
                    <TabPanel value="mitigation" sx={{ p: "24px 0 0" }}><MitigationSection closePopup={closePopup} /></TabPanel>
                </Suspense>
            </TabContext>
        </Stack>
    );
}

export default AddNewRiskForm;