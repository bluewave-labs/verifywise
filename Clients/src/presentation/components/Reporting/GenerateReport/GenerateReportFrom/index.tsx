import React, {useState, lazy, Suspense, useCallback, useContext} from 'react';
import { Stack, Typography, useTheme, SelectChangeEvent} from '@mui/material';
import VWButton from '../../../../vw-v2-components/Buttons';
const Field = lazy(() => import('../../../Inputs/Field'));
import {styles, fieldStyle} from './styles';
import { REPORT_TYPES } from '../constants';
const RadioGroup = lazy(() => import('../../../RadioGroup'));
const Select = lazy(() => import('../../../../components/Inputs/Select'));
import { VerifyWiseContext } from '../../../../../application/contexts/VerifyWise.context';

/** 
 * Set form values 
 */
interface FormValues {
  report_type: string;
  report_name: string;
  project: number;
}

interface FormErrors {
  report_type?: string;
  report_name?: string;
  project?: number;
}

const initialState: FormValues = {
  report_type: "Project risks report",
  report_name: "",
  project: 1
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
  const { dashboardValues } = useContext(VerifyWiseContext);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) =>
      (event: SelectChangeEvent<string | number>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleFormSubmit = () => {
    onGenerate(values);
  }

  return (
    <>
      <Typography sx={styles.titleText}>Generate Report</Typography>
      <Typography sx={styles.baseText}>
        Pick the kind of report you want to create.
      </Typography>
      <Stack sx={{paddingTop: theme.spacing(8)}}>
        <Suspense fallback={<div>Loading...</div>}>
          <Select
            id="project-input"
            label="Project"
            placeholder="Select project"
            value={values.project === 0 ? "" : values.project}
            onChange={handleOnSelectChange("project")}
            items={
              dashboardValues.projects?.map((project: { id: any; project_title: any; }) => ({
                _id: project.id,
                name: project.project_title,
              })) || []
            }
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.report_name}
            isRequired
          />
        </Suspense>
      </Stack>
      <Stack sx={{paddingTop: theme.spacing(8)}}>
        <Typography sx={styles.semiTitleText}>Project Type *</Typography>
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