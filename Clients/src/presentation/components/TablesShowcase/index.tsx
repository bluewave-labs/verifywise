import React, { useState } from 'react';
import ShowcaseLayout from '../ShowcaseLayout';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  Button,
  IconButton,
  Stack,
  Avatar,
  LinearProgress,
  Checkbox,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Divider,
} from '@mui/material';
// Icons using Lucide React inline components
import {
  Search,
  FilterList,
  Download,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Star,
  StarBorder,
} from '@mui/icons-material';

interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface TableData {
  id: number;
  name: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  assignee: string;
  dueDate: string;
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
}

const TablesShowcase: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const columns: TableColumn[] = [
    { id: 'name', label: 'Project Name', minWidth: 200, sortable: true },
    { id: 'status', label: 'Status', minWidth: 120, align: 'center' },
    { id: 'priority', label: 'Priority', minWidth: 100, align: 'center' },
    { id: 'progress', label: 'Progress', minWidth: 150, align: 'center' },
    { id: 'assignee', label: 'Assignee', minWidth: 150 },
    { id: 'dueDate', label: 'Due Date', minWidth: 120, sortable: true },
    { id: 'risk', label: 'Risk Level', minWidth: 120, align: 'center' },
    { id: 'actions', label: 'Actions', minWidth: 100, align: 'center' },
  ];

  const createMockData = (): TableData[] => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Project ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      status: ['Active', 'Pending', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)] as TableData['status'],
      priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as TableData['priority'],
      progress: Math.floor(Math.random() * 101),
      assignee: `User ${i + 1}`,
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      risk: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)] as TableData['risk'],
    }));
  };

  const [data] = useState<TableData[]>(createMockData());

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((n) => n.id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const getRowStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  return (
    <ShowcaseLayout title="Tables & Data" currentPage="/tables-showcase">
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Tables & Data Display
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete reference for data tables, sorting, filtering, and pagination functionality.
      </Typography>

      {/* Standard Data Table */}
      <Typography variant="h4" gutterBottom>Standard Data Table</Typography>
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {selected.length} selected
            </Typography>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < rowsPerPage}
                    checked={rowsPerPage > 0 && selected.length === rowsPerPage}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  const isItemSelected = isSelected(row.id);
                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      <TableCell component="th" scope="row" padding="none">
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {row.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.status}
                          color={getRowStatusColor(row.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.priority}
                          color={getPriorityColor(row.priority) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={row.progress}
                            sx={{ flexGrow: 1 }}
                          />
                          <Typography variant="caption" sx={{ minWidth: 35 }}>
                            {row.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {row.assignee.split(' ')[0][0]}
                          </Avatar>
                          <Typography variant="body2">{row.assignee}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.dueDate}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.risk}
                          color={getRiskColor(row.risk) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Compact Table */}
      <Typography variant="h4" gutterBottom>Compact Table</Typography>
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.slice(0, 5).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={getRowStatusColor(row.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={row.progress}
                      sx={{ height: 4 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small">
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Interactive Table */}
      <Typography variant="h4" gutterBottom>Interactive Table</Typography>
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Favorite</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { id: 1, name: 'Website Redesign', desc: 'Complete overhaul of company website', team: 5, status: 'In Progress', favorite: true },
                { id: 2, name: 'Mobile App', desc: 'Native mobile application development', team: 3, status: 'Planning', favorite: false },
                { id: 3, name: 'API Integration', desc: 'Third-party API integration', team: 2, status: 'Completed', favorite: true },
                { id: 4, name: 'Security Audit', desc: 'Comprehensive security assessment', team: 4, status: 'In Progress', favorite: false },
              ].map((project) => (
                <TableRow key={project.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {project.desc}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={-1}>
                      {Array.from({ length: Math.min(project.team, 3) }).map((_, i) => (
                        <Avatar
                          key={i}
                          sx={{ width: 24, height: 24, fontSize: 12, border: '2px solid white' }}
                        >
                          U{i + 1}
                        </Avatar>
                      ))}
                      {project.team > 3 && (
                        <Avatar
                          sx={{ width: 24, height: 24, fontSize: 10, border: '2px solid white' }}
                        >
                          +{project.team - 3}
                        </Avatar>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      color={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color={project.favorite ? 'primary' : 'default'}>
                      {project.favorite ? <Star /> : <StarBorder />}
                    </IconButton>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View project">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit project">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Responsive Table */}
      <Typography variant="h4" gutterBottom>Responsive Table Layout</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {data.slice(0, 6).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{item.id}
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip
                      label={item.status}
                      color={getRowStatusColor(item.status) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Priority:</Typography>
                    <Chip
                      label={item.priority}
                      color={getPriorityColor(item.priority) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Progress: {item.progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={item.progress} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Risk:</Typography>
                    <Chip
                      label={item.risk}
                      color={getRiskColor(item.risk) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Table Design Guidelines */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Table Design Guidelines</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Sizing & Layout</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Row height: 52px (dense: 40px)</Typography>
              <Typography variant="body2">• Column padding: 16px horizontal</Typography>
              <Typography variant="body2">• Border: 1px solid rgba(0,0,0,0.12)</Typography>
              <Typography variant="body2">• Zebra striping: rgba(0,0,0,0.04)</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Content Structure</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Headers: Typography subtitle2</Typography>
              <Typography variant="body2">• Body text: Typography body2</Typography>
              <Typography variant="body2">• Status: Chip components</Typography>
              <Typography variant="body2">• Actions: Icon buttons (24px)</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Interactive States</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Hover: Background rgba(0,0,0,0.04)</Typography>
              <Typography variant="body2">• Selected: Primary background</Typography>
              <Typography variant="body2">• Sort indicators: Asc/desc arrows</Typography>
              <Typography variant="body2">• Loading: Skeleton rows</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>All Status</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Active</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Completed</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Pending</MenuItem>
      </Menu>
      </Container>
    </ShowcaseLayout>
  );
};

export default TablesShowcase;