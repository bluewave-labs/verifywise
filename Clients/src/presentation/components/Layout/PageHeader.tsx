import { Divider, Stack, Typography } from "@mui/material";

interface PageHeaderProps {
    title: string;
    description?: string;
    rightContent?: React.ReactNode;
}

const PageHeader = ({ title, description, rightContent }: PageHeaderProps) => {
    return (
        <Stack spacing={2}>
            {/* Separator line on very top */}
            <Divider/>

            {/* Title + description */}
            <Stack direction="row" alignItems="center" spacing={1} pt={5}>
                <Typography variant="h5" fontWeight="600" fontSize={16}>
                    {title}
                </Typography>
                {rightContent}
            </Stack>

            {description && (
                <Typography variant="body2" color="text.secondary"  sx={{ mb: 3 }}>
                    {description}
                </Typography>
            )}
        </Stack>
    );
};

export default PageHeader;