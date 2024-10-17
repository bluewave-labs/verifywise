import { Button, Stack, Typography, useTheme } from "@mui/material";
import { RiskData } from "../../../mocks/projects/project-overview.data";
import { Risks } from "../Overview";
import { ProjectRisk } from "../../../mocks/projects/project-risks.data";
import { FC } from "react";
import { VendorRisk } from "../../../mocks/projects/project-vendor-risks.data";

interface RisksViewProps {
    risksSummary: RiskData,
    risksData: ProjectRisk[] | VendorRisk[],
    title: string
}

const RisksView: FC<RisksViewProps>= ({ risksSummary, title }) => {
    const theme = useTheme();

    const styles = {
        btn: {
            width: 120, height: 34,
            fontSize: 13,
            textTransform: "inherit",
            backgroundColor: "#4C7DE7",
            boxShadow: "none",
            borderRadius: 2,
            border: "1px solid #175CD3",
            "&:hover": { boxShadow: "none" }
        },
        tableCellHead: {
            color: theme.palette.other.icon, 
            textTransform: "uppercase",
            fontWeight: "400!important",
            p: "14px!important",
            whiteSpace: "nowrap"
        },
        tableCellContent: {
            whiteSpace: "nowrap"
        }
    }

    return (
        <Stack>
            <Risks sx={{ width: "100%", maxWidth: "968px" }} {...risksSummary}/>
            <Stack sx={{ mt: "33px", maxWidth: "968px" }} direction="row" justifyContent="space-between" alignItems="flex-end">
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>{title} risks</Typography>
                <Button variant="contained" sx={styles.btn} onClick={()=>{}}
                disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}>Add new risk</Button>
            </Stack>
        </Stack>
    )
}

export default RisksView;