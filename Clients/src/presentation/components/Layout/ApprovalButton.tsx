import { Box, Button } from "@mui/material";
import { approvalButtonStyle, approvalCountBadgeStyle } from "./style";
import { ApprovalButtonProps } from "src/domain/interfaces/i.ApprovalForkflow";

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