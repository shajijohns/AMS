import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

export const AdminTenantsListPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/admin/tenants', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
        }
      } catch (e) {
        console.error("Failed to load tenants", e);
      }
    };
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(t => 
    (t.legalName?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (t.eiN_Encrypted?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Tenants List</Typography>
      <Paper sx={{ p: 3 }}>
        <TextField 
          label="Search by Name or EIN" 
          variant="outlined" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          sx={{ mb: 3, width: 300 }} 
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Legal Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.legalName}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>${t.fee?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{t.stateOfIncorporation}</TableCell>
                  <TableCell>
                    <Chip label={t.status} color={t.status === 'Active' ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
              {filteredTenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No tenants found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
