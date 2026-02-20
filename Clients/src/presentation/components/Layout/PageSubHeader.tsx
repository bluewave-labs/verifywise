
import { Stack } from "@mui/material";
import HelperIcon from "../HelperIcon";
import { PageHeader } from "./PageHeader";
import TipBox from "../TipBox";
import { ReactNode } from "react";

interface PageSubHeaderProps {
    title: string;
    description?: string;
    helpArticlePath?: string;
    tipBoxEntity?: string;
    children: ReactNode;
    alert?: ReactNode;
}

/**
 * Layout wrapper for sub-pages inside container modules (Shadow AI, AI Detection).
 * Provides the same spacing as PageHeaderExtended but without breadcrumbs,
 * since the container page already renders them.
 */
export function PageSubHeader({
    title,
    description,
    helpArticlePath,
    tipBoxEntity,
    children,
    alert,
}: PageSubHeaderProps) {
    return (
        <Stack gap="18px">
            <PageHeader
                title={title}
                description={description}
                rightContent={
                    helpArticlePath ? (
                        <HelperIcon articlePath={helpArticlePath} size="small" />
                    ) : undefined
                }
            />

            {tipBoxEntity && <TipBox entityName={tipBoxEntity} />}
            {alert}
            {children}
        </Stack>
    );
}
