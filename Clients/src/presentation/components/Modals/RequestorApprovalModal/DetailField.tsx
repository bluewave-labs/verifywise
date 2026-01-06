import React from 'react';
import { Stack, Typography } from "@mui/material";
import {
    stepDetailLabelStyle,
    stepDetailValueStyle,
    stepDetailValueWithWrapStyle
} from './style';
import { DetailFieldProps } from 'src/domain/interfaces/i.ApprovalForkflow';

const DetailField: React.FC<DetailFieldProps> = ({ label, value, withWrap = false }) => {
    const displayValue = Array.isArray(value) ? value.join(", ") : value;
    
    return (
        <Stack spacing={1}>
            <Typography sx={stepDetailLabelStyle}>
                {label}
            </Typography>
            <Typography sx={withWrap ? stepDetailValueWithWrapStyle : stepDetailValueStyle}>
                {displayValue}
            </Typography>
        </Stack>
    );
};

export default DetailField;