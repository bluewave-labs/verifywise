import { Stack, Typography, useTheme } from "@mui/material";
import { ProjectOverview, RiskData } from "../../../mocks/projects/project-overview.data";
import ProgressBar from "../../../components/ProjectCard/ProgressBar";

interface OverviewProps {
    project: ProjectOverview
}

const Overview = ({project}: OverviewProps) => {
    const { owner, lastUpdated, lastUpdatedBy, controlsStatus, assessmentsStatus, projectRisks, vendorRisks } = project;
    const theme = useTheme();
   
    const styles = { 
        block: {
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: 2,
            backgroundColor: theme.palette.background.main,
            minWidth: 300,
            padding: "8px 36px 14px 14px"
        },
        tytle: {
            fontSize: 12, 
            color: "#8594AC", 
            pb: "2px"
        },
        value: {
            fontSize: 16, 
            fontWeight: 600, 
            color: "#2D3748"
        },
        stack: {
            mb: "37px", 
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: 2,
            backgroundColor: theme.palette.background.main,
            minWidth: 532,
            width: "fit-content"
        },
        stackItem: {
            p: "15px", position: "relative",
            "&:after": { 
                content: `""`, 
                position: "absolute", 
                backgroundColor: "#EEEEEE", 
                top: "13px", right: 0, 
                width: "1px", 
                height: "43px"
            } 
        }
    };

    const progressBarCardRender = (progress: string, label: string) => (
        <Stack sx={styles.block}>
            <Typography sx={{"&:first-letter": { textTransform: "uppercase" }, ...styles.tytle}}>{label} status</Typography>
            <ProgressBar progress={progress} />
            <Typography sx={{fontSize: 11, color: "#8594AC" }}>{progress} {label} completed</Typography>
        </Stack>
    );

    const risksRender = (risks: RiskData) => (
        <Stack direction="row" sx={styles.stack}>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#C63622"}}>Very high risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{risks.veryHighRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#D68B61"}}>High risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{risks.highRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#D6B971"}}>Medium risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{risks.mediumRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#B8D39C"}}>Low risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{risks.lowRisks}</Typography>
            </Stack>
            <Stack sx={{p: "15px"}}>
                <Typography sx={{color: "#52AB43"}}>Very low risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{risks.veryLowRisks}</Typography>
            </Stack>
        </Stack>
    );

    return (
        <Stack>
            <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
                <Stack sx={styles.block}>
                    <Typography sx={styles.tytle}>Owner</Typography>
                    <Typography sx={styles.value}>{owner}</Typography>
                </Stack>
                <Stack sx={styles.block}>
                    <Typography sx={styles.tytle}>Last updated</Typography>
                    <Typography sx={styles.value}>{lastUpdated}</Typography>
                </Stack>
                <Stack sx={styles.block}>
                    <Typography sx={styles.tytle}>Last updated by</Typography>
                    <Typography sx={styles.value}>{lastUpdatedBy}</Typography>
                </Stack>
            </Stack>
            <Stack direction="row" spacing={18} sx={{ pb: "56px" }}>
                {progressBarCardRender(`${controlsStatus.completedControls}/${controlsStatus.totalControls}`, "controls")}
                {progressBarCardRender(`${assessmentsStatus.completedAssessments}/${assessmentsStatus.totalAssessments}`, "assessments")}
            </Stack>
            <Stack>
                <Typography sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}>Project risks</Typography>
                {risksRender(projectRisks)}
            </Stack>
            <Stack>
                <Typography sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}>Vendor risks</Typography>
                {risksRender(vendorRisks)}
            </Stack>
        </Stack>
    )
};

export default Overview;