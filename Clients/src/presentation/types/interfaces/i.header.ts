import { ReactNode } from "react";

export interface PageHeaderExtendedProps {
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