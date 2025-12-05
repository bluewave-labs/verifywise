import React from 'react';
import { Stack, Typography } from '@mui/material';
import StandardModal from '../StandardModal';
import { IStepDetails } from '.';

interface IStepDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stepDetails: IStepDetails | null;
}

const StepDetailsModal: React.FC<IStepDetailsModalProps> = ({
    isOpen,
    onClose,
    stepDetails
}) => {
    if (!stepDetails) {
        return null;
    }

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Step Details"
            description=""
            hideFooter={true}
            maxWidth="600px"
        >
            <Stack spacing={4}>
                {/* Owner */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Owner
                    </Typography>
                    <Typography fontSize={14} color="#475467">
                        {stepDetails.owner}
                    </Typography>
                </Stack>

                {/* Team members */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Team members
                    </Typography>
                    <Typography fontSize={14} color="#475467">
                        {stepDetails.teamMembers.join(", ")}
                    </Typography>
                </Stack>

                {/* Location */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Location
                    </Typography>
                    <Typography fontSize={14} color="#475467">
                        {stepDetails.location}
                    </Typography>
                </Stack>

                {/* Start date */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Start date
                    </Typography>
                    <Typography fontSize={14} color="#475467">
                        {stepDetails.startDate}
                    </Typography>
                </Stack>

                {/* Target industry */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Target industry
                    </Typography>
                    <Typography fontSize={14} color="#475467" sx={{ whiteSpace: "pre-wrap" }}>
                        {stepDetails.targetIndustry}
                    </Typography>
                </Stack>

                {/* Description */}
                <Stack spacing={1}>
                    <Typography fontWeight={600} fontSize={14} color="#344054">
                        Description
                    </Typography>
                    <Typography fontSize={14} color="#475467" sx={{ whiteSpace: "pre-wrap" }}>
                        {stepDetails.description}
                    </Typography>
                </Stack>
            </Stack>
        </StandardModal>
    );
};

export default StepDetailsModal;