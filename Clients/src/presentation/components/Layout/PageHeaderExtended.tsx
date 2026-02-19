
import { Stack, Box } from "@mui/material";
import { PageBreadcrumbs } from "../breadcrumbs/PageBreadcrumbs";
import HelperIcon from "../HelperIcon";
import { PageHeader } from "./PageHeader";
import TipBox from "../TipBox";
import { pageHeaderTitleSectionStyle, pageHeaderSummaryCardsStyle } from "./style";
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
        <Stack className="vwhome" gap={2}>
            <PageBreadcrumbs />

            <Box sx={pageHeaderTitleSectionStyle}>
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

            <Stack gap={1.5}>
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