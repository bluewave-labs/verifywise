import { FC } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableBody, 
  TableCell 
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

interface ChartData {
  type: 'bar' | 'pie' | 'table' | 'donut';
  data: {label: string, value: number, color?: string}[] ;
  title: string;
}

interface ChartRendererProps {
  chartData: ChartData;
}

export const ChartRenderer: FC<ChartRendererProps> = ({ chartData }) => {
  const theme = useTheme();
  const size = 150;

  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return null;
  }

  const { type, data, title } = chartData;
  
  const renderChart = () => {
    const labels = data.map(item => item.label);
    const dataValues = data.map(item => item.value);
    switch (type) {
      case 'bar':
        return (
          <BarChart
            xAxis={[{ scaleType: 'band', data: labels }]}
            series={[{ data: dataValues }]}
            height={200}
            margin={{ left: 0, right: 20, top: 20 }}
          />
        );

      case 'pie':
        return (
          <PieChart
            series={[
              {
                data: data.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.label,
                  color: item.color,
                })),
                faded: { innerRadius: 30, additionalRadius: -30 },
              },
            ]}
            width={size}
            height={size}
          />
        );

      case 'donut':
        return (
          <PieChart
            series={[
              {
                data: data.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.label,
                  color: item.color,
                })),
                innerRadius: size * 0.35,
                outerRadius: size * 0.45,
                paddingAngle: 2,
                cornerRadius: 2,
              },
            ]}
            width={size}
            height={size}
          />
        );

      case 'table':
        return (
          <Box sx={{ overflowX: 'auto', mt: 3 }}>
            <TableContainer>
            <Table sx={{ minWidth: 300 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    key={"Label"}
                    sx={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.grey[50],
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    Label
                  </TableCell>
                  <TableCell
                    key={"Value"}
                    sx={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.grey[50],
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    Value
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index)=> (
                    <TableRow
                      key={`row-${index}`}
                      tabIndex={0}
                      role="button"
                    >
                      
                      <TableCell sx={{ fontWeight: 500 }}>{item.label}</TableCell>
                      <TableCell>{item.value}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unsupported chart type: {type}
          </Typography>
        );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 2,
        marginTop: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
      }}
    >
      {title && (
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, marginBottom: 2 }}>
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        {renderChart()}
      </Box>
    </Paper>
  );
};
