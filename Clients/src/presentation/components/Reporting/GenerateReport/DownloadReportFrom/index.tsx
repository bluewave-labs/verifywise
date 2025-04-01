import { Stack, Typography } from '@mui/material'
import {styles} from './styles';

const DownloadReportForm = () => {
  return (
    <Stack sx={styles.container}>
      <Typography sx={styles.titleText}>
        Preparing your report...
      </Typography>
      <Typography sx={styles.baseText}>
        Your report is being generated and will download automatically. <br /> Hang tight!
      </Typography>
    </Stack>
  )
}

export default DownloadReportForm