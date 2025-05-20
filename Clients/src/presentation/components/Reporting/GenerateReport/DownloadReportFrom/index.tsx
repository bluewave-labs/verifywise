import React from 'react';
import { Stack, Typography } from '@mui/material'
import {styles} from './styles';

interface StatusProps {
  statusCode: number;
}

const DownloadReportForm: React.FC<StatusProps> = ({
  statusCode
}) => {
  return (
    <>
    {statusCode === 200 ?
        <Stack sx={styles.container}>
          <Typography sx={styles.titleText}>
            Preparing your report...
          </Typography>
          <Typography sx={styles.baseText}>
            Your report is being generated and will download automatically. <br /> Hang tight!
          </Typography>
        </Stack>
      : <>
        {statusCode === 403 ?
          <Stack sx={styles.container}>
            <Typography sx={{...styles.titleText, color: 'error.main'}}>
              Access denied...
            </Typography>
            <Typography sx={{...styles.baseText, color: 'error.main'}}>
              It looks like you're not authorized to generate this report, as you're not part of the selected project.
            </Typography>
          </Stack>
          : 
          <Stack sx={styles.container}>
            <Typography sx={{...styles.titleText, color: 'error.main'}}>
              Sorry...
            </Typography>
            <Typography sx={{...styles.baseText, color: 'error.main'}}>
              Unexpected error occurs while downloading the report.
            </Typography>
          </Stack>
        }
      </> 
    }
    </>
  )
}

export default DownloadReportForm