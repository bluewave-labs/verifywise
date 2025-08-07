import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useSelector } from 'react-redux';
import { extractUserToken } from '../../../../application/tools/extractToken';
import { downloadResource } from '../../../../application/tools/downloadResource';
import { aiTrustCenterTableCell } from '../style';

const Resources = ({ data, loading, error }: { data: any; loading: boolean; error: string | null }) => {
  const authToken = useSelector((state: { auth: { authToken: string } }) => state.auth.authToken);
  const userToken = extractUserToken(authToken);
  const tenantHash = userToken?.tenantId;

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data || !data.resources || data.resources.length === 0) return <Typography>No resources available.</Typography>;

  const handleDownload = async (id: string) => {
    if (tenantHash) {
      await downloadResource(id, tenantHash);
    }
  };

  return (
    <Box width="100%">
      <Typography variant="subtitle2" color="#13715B" sx={{ fontWeight: 600, mb: 2 }}>
        Resources
      </Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid #EEEEEE', borderRadius: 1, boxShadow: 'none'}}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: '#FAFAFA' }}>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', paddingLeft: 4 }}>document name</TableCell>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', paddingRight: 11 }} align="right">action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.resources.map((resource: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell sx={aiTrustCenterTableCell}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleOutlineIcon sx={{ color: '#28A745', fontSize: 24 }} />
                    <Typography  color="#344054" sx={{ fontSize: 13 }}>{resource.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={aiTrustCenterTableCell}>
                  <Button
                    onClick={() => handleDownload(resource.id)}
                    size="small"
                    sx={{
                      fontSize: 13,
                      minWidth: 100,
                      backgroundColor: '#fff',
                      color: '#344054',
                      border: '1px solid #D0D5DD',
                      borderRadius: 1,
                    }}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Resources;