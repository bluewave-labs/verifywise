import { Theme } from "@emotion/react";
import { SxProps, Stack, Typography, useTheme } from "@mui/material";
import { FC } from "react";
import { RiskData } from "../../mocks/projects/project-overview.data";

const Risks: FC<RiskData & {sx?: SxProps<Theme> | undefined}> = (
    { veryHighRisks, highRisks, mediumRisks, lowRisks, veryLowRisks, sx }
) => {
    const theme = useTheme();

    const styles = {
        stack: {
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: 2,
            backgroundColor: theme.palette.background.main,
            minWidth: 532,
            width: "fit-content"
        },
        stackItem: {
            p: "15px", 
            position: "relative",
            width: 124,
            "&:after": { 
                content: `""`, 
                position: "absolute", 
                backgroundColor: "#EEEEEE", 
                top: "13px", right: 0, 
                width: "1px", 
                height: "43px"
            } 
        }
    }

    return (
        <Stack direction="row" justifyContent="space-between" sx={{...styles.stack, ...sx}}>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#C63622"}}>Very high risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{veryHighRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#D68B61"}}>High risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{highRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#D6B971"}}>Medium risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{mediumRisks}</Typography>
            </Stack>
            <Stack sx={styles.stackItem}>
                <Typography sx={{color: "#B8D39C"}}>Low risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{lowRisks}</Typography>
            </Stack>
            <Stack sx={{p: "15px", width: 124}}>
                <Typography sx={{color: "#52AB43"}}>Very low risks</Typography>
                <Typography sx={{color: theme.palette.text.secondary}}>{veryLowRisks}</Typography>
            </Stack>
        </Stack>
    );
}

export default Risks;