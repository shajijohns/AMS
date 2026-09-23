import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const AdminApproveTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants?status=PendingOnboarding', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      }
    } catch (e) {
      console.error("Failed to load tenants", e);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleAction = async (id: string, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this tenant?`)) return;
    try {
      const response = await fetch(`/api/admin/tenants/${id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        fetchTenants();
      } else {
        alert(`Failed to ${action} tenant.`);
      }
    } catch (e) {
      alert(`Error trying to ${action} tenant.`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Approve Tenants</Typography>
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Legal Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.legalName}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.stateOfIncorporation}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton color="primary"><VisibilityIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton color="success" onClick={() => handleAction(t.id, 'approve')}><CheckCircleIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Deny">
                      <IconButton color="error" onClick={() => handleAction(t.id, 'deny')}><CancelIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Deactivate">
                      <IconButton color="warning" onClick={() => handleAction(t.id, 'deactivate')}><BlockIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No tenants pending approval.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
