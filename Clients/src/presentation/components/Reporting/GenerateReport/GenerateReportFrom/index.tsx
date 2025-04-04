import React, {useState, lazy, Suspense, useCallback} from 'react';
import { Stack, Typography, useTheme} from '@mui/material';
import VWButton from '../../../../vw-v2-components/Buttons';
const Field = lazy(() => import('../../../Inputs/Field'));
import {styles, fieldStyle} from './styles';
import { REPORT_TYPES } from '../constants';
const RadioGroup = lazy(() => import('../../../RadioGroup'));

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

interface ReportProps {
  onGenerate: (formValues: any) => void;
}

const GenerateReportFrom: React.FC<ReportProps> = ({
  onGenerate
}) => {
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const theme = useTheme();

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleFormSubmit = () => {
    // backend API call
    onGenerate(values);
  }

  return (
    <>
      <Typography sx={styles.titleText}>Report Type</Typography>
      <Typography sx={styles.baseText}>
        Pick the kind of report you want to create.
      </Typography>
      <Stack sx={{paddingTop: theme.spacing(8)}}>
        <Suspense fallback={<div>Loading...</div>}>
          <RadioGroup 
            values={REPORT_TYPES} 
            defaultValue='Project risks report' />
        </Suspense>
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
      <Stack sx={styles.btnWrap}>
        <VWButton
          sx={styles.VWButton}
          variant="contained"
          text="Generate report"
          onClick={handleFormSubmit}
        />
      </Stack>
    </>
  )
}

export default GenerateReportFrom