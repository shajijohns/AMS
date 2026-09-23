import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, CircularProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, Box,
  TextField, TableSortLabel, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface AssociationData {
  id: string;
  legalName: string;
  displayName: string;
  type: string;
  status: string;
  stateRegNumber: string;
  stateRegDate: string;
  stateOfIncorporation: string;
  createdUtc: string;
}

type Order = 'asc' | 'desc';

export const AdminAssociationsPage: React.FC = () => {
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof AssociationData>('createdUtc');
  const [order, setOrder] = useState<Order>('desc');
  
  const navigate = useNavigate();

  const fetchAssociations = () => {
    setLoading(true);
    fetch('http://localhost:5200/api/admin/associations', { credentials: 'include' })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          navigate('/admin/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setAssociations(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error("Error fetching associations:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssociations();
  }, [navigate]);

  const handleSort = (property: keyof AssociationData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PendingOnboarding': return <Chip label="Pending" color="warning" size="small" />;
      case 'Active': return <Chip label="Active" color="success" size="small" />;
      case 'Inactive': return <Chip label="Inactive" color="error" size="small" />;
      default: return <Chip label={status || 'Unknown'} size="small" />;
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedAssociations = useMemo(() => {
    // 1. Filter
    let result = associations.filter(assoc => {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        (assoc.legalName || '').toLowerCase().includes(lowerQuery) ||
        (assoc.displayName || '').toLowerCase().includes(lowerQuery) ||
        (assoc.id || '').toLowerCase().includes(lowerQuery) ||
        (assoc.stateRegNumber || '').toLowerCase().includes(lowerQuery)
      );
    });

    // 2. Sort
    result = result.sort((a, b) => {
      let valA: any = a[orderBy] || '';
      let valB: any = b[orderBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [associations, searchQuery, orderBy, order]);

  if (loading && associations.length === 0) {
    return (
      <Container sx={{ mt: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Associations
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search associations..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: 300, bgcolor: 'white', borderRadius: 1, '& .MuiInputBase-root': { color: 'black' } }}
        />
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }} aria-label="associations table" size="medium">
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'legalName'}
                  direction={orderBy === 'legalName' ? order : 'asc'}
                  onClick={() => handleSort('legalName')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Legal Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleSort('id')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Tenant ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleSort('type')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'stateOfIncorporation'}
                  direction={orderBy === 'stateOfIncorporation' ? order : 'asc'}
                  onClick={() => handleSort('stateOfIncorporation')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  State
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleSort('status')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedAssociations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No associations found matching your search.</TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAssociations.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.legalName || 'N/A'}</Typography>
                    {row.displayName && row.displayName !== row.legalName && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        DBA: {row.displayName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{row.id}</Typography>
                  </TableCell>
                  <TableCell>{row.type || 'N/A'}</TableCell>
                  <TableCell>{row.stateOfIncorporation || 'N/A'}</TableCell>
                  <TableCell>{getStatusLabel(row.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
