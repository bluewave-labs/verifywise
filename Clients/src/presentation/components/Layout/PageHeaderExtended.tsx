
import { Stack, Box } from "@mui/material";
import { PageBreadcrumbs } from "../breadcrumbs/PageBreadcrumbs";
import HelperIcon from "../HelperIcon";
import { PageHeader } from "./PageHeader";
import TipBox from "../TipBox";
import { pageHeaderSummaryCardsStyle } from "./style";
import { PageHeaderExtendedProps } from "src/presentation/types/interfaces/i.header";

export function PageHeaderExtended({
    title,
    description,
    helpArticlePath,
    tipBoxEntity,
    summaryCards,
    summaryCardsJoyrideId,
    children,
    alert,
    loadingToast,
}: PageHeaderExtendedProps) {
    return (
        <Stack className="vwhome" gap={0}>
            <PageBreadcrumbs sx={{ mb: 0, "& > hr": { mb: 0 } }} />

            <Box sx={{ mt: "16px" }}>
                <PageHeader
                    title={title}
                    description={description}
                    rightContent={
                        helpArticlePath ? (
                            <HelperIcon articlePath={helpArticlePath} size="small" />
                        ) : undefined
                    }
                />
            </Box>

            <Stack gap="18px" sx={{ mt: "18px" }}>
                {tipBoxEntity && <TipBox entityName={tipBoxEntity} />}

                {alert}
                {loadingToast}

                {summaryCards && (
                    <Box
                        data-joyride-id={summaryCardsJoyrideId}
                        sx={pageHeaderSummaryCardsStyle}
                    >
                        {summaryCards}
                    </Box>
                )}

                {children}
            </Stack>
        </Stack>
    );
}