import { Button, Stack, Typography, useTheme } from "@mui/material";
import { RiskData } from "../../../mocks/projects/project-overview.data";
import { ProjectRisk } from "../../../mocks/projects/project-risks.data";
import { FC } from "react";
import { VendorRisk } from "../../../mocks/projects/project-vendor-risks.data";
import BasicTable from "../../../components/Table";
import Risks from "../../../components/Risks";

interface RisksViewProps {
    risksSummary: RiskData,
    risksData: ProjectRisk[] | VendorRisk[],
    title: string
}

const RisksView: FC<RisksViewProps>= ({ risksSummary, risksData, title }) => {
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
        }
    }

    const colsName = [ "RISK NAME", title, "IMPACT", "PROBABILITY", "OWNER", "SEVERITY", "LIKELIHOOD", "RISK LEVEL", "MITIGATION", "FINAL RISK LEVEL" ]

    const risksTableCals = colsName.reduce<{ id: string, name: string }[]>((acc, item, i) => {
        acc.push({
            id: Object.keys(risksData[0])[i],
            name: item
        })

        return acc
    }, []);
    
    const risksTableRows = risksData.reduce<{ id: string, data: { id: string, data: string | number }[] }[]>((acc, item, i) => {
        const rowData = Object.keys(item).map((key, indexKey) => {
            const typedKey = key as keyof (ProjectRisk | VendorRisk);
            return ({
                id: `${key}_${i}_${indexKey}`,
                data: item[typedKey]
            })
        });
    
        acc.push({
            id: `${item.riskName}_${i}`,
            data: rowData
        });
    
        return acc;
    }, []);
    
  
    const tableData = {
        cols: risksTableCals,
        rows: risksTableRows
    }

    return (
        <Stack sx={{ maxWidth: 1220 }}>
            <Risks {...risksSummary}/>
            <Stack sx={{ mt: "33px", mb: "28px" }} direction="row" justifyContent="space-between" alignItems="flex-end">
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>{title} risks</Typography>
                <Button variant="contained" sx={styles.btn} onClick={()=>{}}
                disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}>Add new risk</Button>
            </Stack>
            <BasicTable 
                data={tableData} 
                table="risksTable" 
            />
        </Stack>
    )
}

export default RisksView;