
import React, { ReactNode } from "react";
import { Stack, Box } from "@mui/material";
import PageBreadcrumbs from "../Breadcrumbs/PageBreadcrumbs";
import HelperIcon from "../HelperIcon";
import PageHeader from "./PageHeader";
import TipBox from "../TipBox";
import { pageHeaderTitleSectionStyle, pageHeaderSummaryCardsStyle } from "./style";

interface PageHeaderExtendedProps {
    title: string;
    description?: string;
    helpArticlePath?: string;
    tipBoxEntity?: string;
    summaryCards?: ReactNode;
    summaryCardsJoyrideId?: string;
    children: ReactNode;
    alert?: ReactNode;
    loadingToast?: ReactNode;
}

const PageHeaderExtended: React.FC<PageHeaderExtendedProps> = ({
    title,
    description,
    helpArticlePath,
    tipBoxEntity,
    summaryCards,
    summaryCardsJoyrideId,
    children,
    alert,
    loadingToast,
}) => {
    return (
        <Stack className="vwhome" gap="16px">
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

            <Stack gap="12px">
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
};

export default PageHeaderExtended;