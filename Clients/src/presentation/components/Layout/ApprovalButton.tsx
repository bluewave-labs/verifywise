import { Box, Button } from "@mui/material";
import { approvalButtonStyle, approvalCountBadgeStyle } from "./style";

interface ApprovalButtonProps {
    label: string;
    count: number;
    onClick: () => void;
}

const ApprovalButton: React.FC<ApprovalButtonProps> = ({ label, count, onClick }) => (
    <Button
        variant="contained"
        size="small"
        onClick={onClick}
        sx={approvalButtonStyle}
    >
        {label}
        <Box
            component="span"
            sx={approvalCountBadgeStyle}
        >
            {count}
        </Box>
    </Button>
);

export default ApprovalButton;