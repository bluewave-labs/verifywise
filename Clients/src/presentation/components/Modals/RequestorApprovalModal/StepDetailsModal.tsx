import React from 'react';
import { Stack, Typography } from '@mui/material';
import StandardModal from '../StandardModal';
import { IStepDetails } from '.';
import {
    stepDetailLabelStyle,
    stepDetailValueStyle,
    stepDetailValueWithWrapStyle
} from './style';

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
                    <Typography sx={stepDetailLabelStyle}>
                        Owner
                    </Typography>
                    <Typography sx={stepDetailValueStyle}>
                        {stepDetails.owner}
                    </Typography>
                </Stack>

                {/* Team members */}
                <Stack spacing={1}>
                    <Typography sx={stepDetailLabelStyle}>
                        Team members
                    </Typography>
                    <Typography sx={stepDetailValueStyle}>
                        {stepDetails.teamMembers.join(", ")}
                    </Typography>
                </Stack>

                {/* Location */}
                <Stack spacing={1}>
                    <Typography sx={stepDetailLabelStyle}>
                        Location
                    </Typography>
                    <Typography sx={stepDetailValueStyle}>
                        {stepDetails.location}
                    </Typography>
                </Stack>

                {/* Start date */}
                <Stack spacing={1}>
                    <Typography sx={stepDetailLabelStyle}>
                        Start date
                    </Typography>
                    <Typography sx={stepDetailValueStyle}>
                        {stepDetails.startDate}
                    </Typography>
                </Stack>

                {/* Target industry */}
                <Stack spacing={1}>
                    <Typography sx={stepDetailLabelStyle}>
                        Target industry
                    </Typography>
                    <Typography sx={stepDetailValueWithWrapStyle}>
                        {stepDetails.targetIndustry}
                    </Typography>
                </Stack>

                {/* Description */}
                <Stack spacing={1}>
                    <Typography sx={stepDetailLabelStyle}>
                        Description
                    </Typography>
                    <Typography sx={stepDetailValueWithWrapStyle}>
                        {stepDetails.description}
                    </Typography>
                </Stack>
            </Stack>
        </StandardModal>
    );
};

export default StepDetailsModal;