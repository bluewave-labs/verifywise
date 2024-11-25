import { FC, memo } from "react";
import { Typography, Stack } from "@mui/material";
import dashboardData from "../../mocks/dashboard/dashboard.data";
import { StyledStack, styles } from "./styles";

interface MetricSectionProps {
    title: string;
    metricType: "compliance" | "risk";
}

/**
 * MetricSection component displays a section with metrics based on the provided metric type.
 *
 * @component
 * @param {Object} props - The props for the MetricSection component.
 * @param {string} props.title - The title of the metric section.
 * @param {string} props.metricType - The type of metrics to display, either "compliance" or "risk".
 * @returns {JSX.Element} The rendered MetricSection component.
 */
const MetricSection: FC<MetricSectionProps> = ({ title, metricType }) => {
    const { complianceStatus, riskStatus } = dashboardData;
    const complianceMetrics: {
        title: string;
        value: string | number;
    }[] = [
            {
                title: "Completed requirements",
                value: `${complianceStatus.assessmentCompletionRate}%`,
            },
            {
                title: "Completed assessments",
                value: complianceStatus.completedAssessments,
            },
            {
                title: "Assessment completion rate",
                value: `${complianceStatus.completedRequirementsPercentage}%`,
            },
        ];
    const riskMetrics: {
        title: string;
        value: string | number;
    }[] = [
            { title: "Acceptable risks", value: riskStatus.acceptableRisks },
            { title: "Residual risks", value: riskStatus.residualRisks },
            { title: "Unacceptable risks", value: riskStatus.unacceptableRisks },
        ];

    const metrics = metricType === "compliance" ? complianceMetrics : riskMetrics;

    return (
        <>
            <Typography
                variant="h2"
                component="div"
                sx={{
                    pb: 8.5, mt: 17,
                    color: "#1A1919",
                    fontSize: 16,
                    fontWeight: 600
                }}
            >
                {title}
            </Typography>
            <Stack direction="row" justifyContent="space-between" spacing={15}>
                {metrics.map((metric, index) => (
                    <StyledStack key={index}>
                        <Typography sx={styles.gridTitle}>{metric.title}</Typography>
                        <Typography sx={styles.gridValue}>{metric.value}</Typography>
                    </StyledStack>
                ))}
            </Stack>
        </>
    )
};

export default memo(MetricSection);