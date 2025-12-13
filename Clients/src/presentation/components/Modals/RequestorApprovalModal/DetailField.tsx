import React from 'react';
import { Stack, Typography } from "@mui/material";
import {
    stepDetailLabelStyle,
    stepDetailValueStyle,
    stepDetailValueWithWrapStyle
} from './style';

interface DetailFieldProps {
    label: string;
    value: string | string[];
    withWrap?: boolean;
}

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