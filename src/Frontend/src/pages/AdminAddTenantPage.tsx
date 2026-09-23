import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';

export const AdminAddTenantPage: React.FC = () => {
  const [formData, setFormData] = useState({
    legalName: '', displayName: '', type: '', fee: '', ein: '', stateReg: '', stateInc: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LegalName: formData.legalName,
          DisplayName: formData.displayName,
          Type: formData.type,
          Fee: parseFloat(formData.fee) || 0,
          EIN_Encrypted: formData.ein,
          StateRegNumber: formData.stateReg,
          StateOfIncorporation: formData.stateInc
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setSuccess(true);
        setFormData({ legalName: '', displayName: '', type: '', fee: '', ein: '', stateReg: '', stateInc: '' });
      }
    } catch (e) {
      alert("Error adding tenant");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Add Tenant</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>Tenant created successfully!</Alert>}
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <TextField fullWidth required label="Legal Name" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} />
            </Box>
            <Box>
              <TextField fullWidth label="Display Name" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
            </Box>
            <Box>
              <TextField fullWidth label="Type (e.g. Federation, Association)" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
            </Box>
            <Box>
              <TextField fullWidth type="number" label="Fee" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              <TextField fullWidth label="EIN" value={formData.ein} onChange={e => setFormData({...formData, ein: e.target.value})} />
              <TextField fullWidth label="State Reg Number" value={formData.stateReg} onChange={e => setFormData({...formData, stateReg: e.target.value})} />
              <TextField fullWidth label="State of Inc." value={formData.stateInc} onChange={e => setFormData({...formData, stateInc: e.target.value})} />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Button type="submit" variant="contained" color="primary">Add Tenant</Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
