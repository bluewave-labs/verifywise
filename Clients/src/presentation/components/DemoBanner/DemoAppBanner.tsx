import { Box, Typography } from "@mui/material";
import { ENV_VARs } from "../../../../env.vars";
import styles from "./styles";

interface DemoAppBannerProps {
    sx?: React.CSSProperties;
}

const DemoAppBanner = ({ sx }: DemoAppBannerProps) => {

    const isDemoApp = ENV_VARs.IS_DEMO_APP;
    if (!isDemoApp) {
        return null;
    }

    return (
        <Box
            sx={{ ...styles.container, ...sx }}
        >
            <Typography sx={styles.text} >
                You're viewing a public demo of the VerifyWise AI governance platform. Feel free to explore using demo data, but please don't enter any personal or company information.
            </Typography>
        </Box>
    );
}

export default DemoAppBanner;