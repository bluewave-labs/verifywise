import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react'
import { Stack, Typography, IconButton, Box, Radio, RadioProps, RadioGroup, FormControlLabel, FormControl, useTheme, TextField, Button } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import styled from 'styled-components';
const Field = lazy(() => import("../Inputs/Field"))
import VWButton from '../../vw-v2-components/Buttons';

interface GenerateReportProps {
  onClose: () => void;
}

const REPORT_TYPES = [
  "Project risks report",
  "Compliance tracker report",
  "Assessment tracker report",
  "Vendors and risks report",
  "All reports combined in one file"
]

/** 
 * Set form values 
 */
interface FormValues {
  report_type: string;
  report_name: string;
}

interface FormErrors {
  report_type?: string;
  report_name?: string;
}

const initialState: FormValues = {
  report_type: "Project risks report",
  report_name: ""
}

/**
 * Set radio checked style
 */
const BpIcon = styled('span')(() => ({
  borderRadius: '50%',
  width: 20,
  height: 20,
  boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
  backgroundColor: '#ffffff',
  '.Mui-focusVisible &': {
    outline: '2px auto rgba(19,124,189,.6)',
    outlineOffset: 2,
  },
  'input:hover ~ &': {
    backgroundColor: '#fbfbfb',
  },
}));

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: '#1570EF',
  boxShadow: 'inset 0 0 0 1px #297af2, inset 0 -1px 0 #297af2',
  '&::before': {
    display: 'block',
    width: 20,
    height: 20,
    backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
    content: '""',
  },
  'input:hover ~ &': {
    backgroundColor: '#1570EF',
  },
});

const RadioElement = (props: RadioProps) => {
  return(<>
    <Radio
      disableRipple
      sx={{
        color: "#D0D5DD"
      }}
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  </>)
}

const GenerateReportPopup: React.FC<GenerateReportProps> = ({
  onClose
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const fieldStyle = useMemo(
    () => ({  
      fontWeight: 'bold',    
      backgroundColor: theme.palette.background.main,
      "& input": {
        padding: "0 14px",
      },
    }),
    [theme.palette.background.main]
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );
  
  return (
    <Box sx={{padding: theme.spacing(12)}} component="form">
      <Stack>
        <Typography sx={{ 
          fontSize: theme.palette.text.primary, 
          color: "#344054", 
          fontWeight: "bold" }}>Report Type</Typography>
        <Typography 
          sx={{
            color: theme.palette.text.secondary,
            fontSize: theme.typography.fontSize,
          }}>
          Pick the kind of report you want to create.
        </Typography>
        <IconButton onClick={onClose} sx={{position: 'absolute', right: '12px', top: '10px'}}>
          <CloseIcon sx={{ width: 24, height: 24 }} />
        </IconButton>
      </Stack>
      <Stack sx={{paddingTop: theme.spacing(8)}}>
        <FormControl>
          <RadioGroup
            aria-labelledby="report-types-radio-buttons-group-label"
            defaultValue="Project risks report"
            name="radio-buttons-group"
          >
            {REPORT_TYPES.map(report => (
              <FormControlLabel 
                value={report} 
                control={<RadioElement />} 
                label={report} 
                sx={{color: "#475467", fontSize: theme.typography.fontSize}} 
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Stack>
      <Stack sx={{paddingTop: theme.spacing(4)}}>
        <Suspense fallback={<div>Loading...</div>}>
          <Field
            id="report-name"
            label="What should we call your report?"
            width="350px"
            value={values.report_name}
            onChange={handleOnTextFieldChange("report_name")}
            error={errors.report_name}
            sx={fieldStyle}
          />
        </Suspense>
      </Stack>
      <Stack 
        sx={{
          paddingTop: theme.spacing(12),
          display: 'flex',
          alignItems: 'flex-end'
        }}
      >
        <VWButton
          sx={{
            width: { xs: "100%", sm: theme.spacing(80) },
            mb: theme.spacing(4),
            backgroundColor: "#4C7DE7",
            color: "#fff",
            border: "1px solid #4C7DE7",
            gap: 2,
          }}
          variant="contained"
          text="Generate report"
        />
      </Stack>
    </Box>
  )
}

export default GenerateReportPopup