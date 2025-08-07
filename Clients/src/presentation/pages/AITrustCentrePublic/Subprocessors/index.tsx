
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { aiTrustCenterTableCell } from '../style';


const Subprocessors = ({ data, loading, error }: { data: any; loading: boolean; error: string | null }) => {
  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data || !data.subprocessor || data.subprocessor.length === 0) return <Typography>No subprocessors available.</Typography>;

  return (
    <Box width="100%">
      <Typography variant="subtitle2" color="#13715B" sx={{ fontWeight: 600, mb: 2 }}>
        Subprocessors
      </Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid #EEEEEE', borderRadius: 1, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: '#FAFAFA' }}>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', px: 4 }}>company name</TableCell>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', px: 4 }}>url</TableCell>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', px: 4 }}>purpose</TableCell>
              <TableCell sx={{ fontWeight: 400, color: '#667085', fontSize: 12, textTransform: 'uppercase', px: 4 }}>location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.subprocessor.map((sp: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell sx={aiTrustCenterTableCell}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{sp.name}</Typography>
                </TableCell>
                <TableCell sx={aiTrustCenterTableCell}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{sp.url}</Typography>
                </TableCell>
                <TableCell sx={aiTrustCenterTableCell}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{sp.purpose}</Typography>
                </TableCell>
                <TableCell sx={aiTrustCenterTableCell}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{sp.location}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Subprocessors;