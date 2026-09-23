import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Grid, Divider
} from '@mui/material';

interface RequestDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  requestData: any;
}

const formatLabel = (key: string) => {
  // Insert space before capital letters and capitalize the first letter
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
};

const RenderFields: React.FC<{ data: any, prefix?: string }> = ({ data, prefix = '' }) => {
  if (!data || typeof data !== 'object') return null;

  return (
    <Grid container spacing={2}>
      {Object.entries(data).map(([key, value]) => {
        const label = formatLabel(key);
        const itemKey = prefix + key;

        // Recursively render nested objects
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <Grid size={{ xs: 12 }} key={itemKey}>
              <Box sx={{ mt: 1, mb: 1, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {label}
                </Typography>
                <RenderFields data={value} prefix={itemKey + '-'} />
              </Box>
            </Grid>
          );
        }

        // Render simple key-value pairs
        let displayValue: React.ReactNode = '-';
        if (value !== null && value !== undefined && value !== '') {
          const strValue = String(value).trim();
          const isImage = strValue.startsWith('data:image/');
          const isSignature = key.toLowerCase().includes('signature') && strValue.length > 100;

          if (isImage || isSignature) {
            const imgSrc = strValue.startsWith('data:image/') ? strValue : `data:image/png;base64,${strValue}`;
            displayValue = (
              <Box 
                component="img" 
                src={imgSrc} 
                alt={label} 
                sx={{ 
                  maxWidth: '100%', 
                  maxHeight: '80px', 
                  objectFit: 'contain', 
                  bgcolor: 'white', 
                  borderRadius: 1, 
                  p: 0.5,
                  mt: 0.5,
                  border: '1px dashed #ccc'
                }} 
              />
            );
          } else {
            displayValue = strValue;
          }
        }

        return (
          <Grid size={{ xs: 12, sm: 6 }} key={itemKey}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {label}
              </Typography>
              <Typography variant="body2" component="div" sx={{ wordBreak: 'break-word', fontWeight: 500 }}>
                {displayValue}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

export const RequestDetailsDialog: React.FC<RequestDetailsDialogProps> = ({ open, onClose, requestData }) => {
  if (!requestData) return null;

  let parsedPayload: any = {};
  try {
    parsedPayload = JSON.parse(requestData.payloadJson);
  } catch (e) {
    parsedPayload = { error: "Failed to parse payload" };
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 2 }}>
        Association Request Details
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Metadata Section */}
          <Box>
            <Typography variant="h6" gutterBottom color="primary">System Metadata</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Request ID</Typography>
                <Typography variant="body2">{requestData.id}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Tenant ID</Typography>
                <Typography variant="body2">{requestData.tenantUniqueId || 'Pending'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Submitted By</Typography>
                <Typography variant="body2">{requestData.submittedByEmail}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Date Submitted</Typography>
                <Typography variant="body2">{new Date(requestData.createdUtc).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Form Data Section */}
          <Box>
            <Typography variant="h6" gutterBottom color="primary">Registration Data</Typography>
            <RenderFields data={parsedPayload} />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="primary" variant="contained" size="large">
          Close Details
        </Button>
      </DialogActions>
    </Dialog>
  );
};
