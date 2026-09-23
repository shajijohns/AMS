import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, TextField, Button, CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

export const AdminConfigurationPage: React.FC = () => {
  const [provider, setProvider] = useState('smtp');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpUserId, setSmtpUserId] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [azureConnectionString, setAzureConnectionString] = useState('');
  const [azureSenderEmail, setAzureSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:5200/api/admin/configuration', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setProvider(data.EmailProvider || 'smtp');
          setSmtpServer(data.SmtpServer || '');
          setSmtpUserId(data.SmtpUserId || '');
          setSmtpPassword(data.SmtpPassword || '');
          setAzureConnectionString(data.AzureConnectionString || '');
          setAzureSenderEmail(data.AzureSenderEmail || '');
        }
      } catch (e) {
        console.error("Failed to load configuration", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const settings = {
      EmailProvider: provider,
      SmtpServer: smtpServer,
      SmtpUserId: smtpUserId,
      SmtpPassword: smtpPassword,
      AzureConnectionString: azureConnectionString,
      AzureSenderEmail: azureSenderEmail
    };

    try {
      const response = await fetch('http://localhost:5200/api/admin/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      if (response.ok) {
        alert("Configuration saved successfully!");
      } else {
        alert("Failed to save configuration.");
      }
    } catch (e) {
      console.error("Failed to save configuration", e);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>System Configuration</Typography>
      
      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">Email Delivery Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Configure the default email provider used by the system to send invitations and notifications.
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="email-provider-label">Default Email Provider</InputLabel>
          <Select
            labelId="email-provider-label"
            value={provider}
            label="Default Email Provider"
            onChange={(e) => setProvider(e.target.value)}
          >
            <MenuItem value="smtp">Hosting SMTP</MenuItem>
            <MenuItem value="azure">Azure Mail Service</MenuItem>
          </Select>
        </FormControl>

        {provider === 'smtp' && (
          <Box>
            <TextField fullWidth label="SMTP Server" value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} sx={{ mb: 3 }} />
            <TextField fullWidth label="SMTP User ID" value={smtpUserId} onChange={(e) => setSmtpUserId(e.target.value)} sx={{ mb: 3 }} />
            <TextField fullWidth type="password" label="SMTP Password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} sx={{ mb: 3 }} />
          </Box>
        )}

        {provider === 'azure' && (
          <Box>
            <TextField fullWidth label="Azure Connection String" value={azureConnectionString} onChange={(e) => setAzureConnectionString(e.target.value)} sx={{ mb: 3 }} />
            <TextField fullWidth label="Azure Sender Email" value={azureSenderEmail} onChange={(e) => setAzureSenderEmail(e.target.value)} sx={{ mb: 3 }} />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
