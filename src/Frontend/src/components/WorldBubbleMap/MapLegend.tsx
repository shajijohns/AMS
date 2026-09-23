import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { STATUS_COLORS } from './types';

interface MapLegendProps {
  activeStatuses: string[];
}

export const MapLegend: React.FC<MapLegendProps> = ({ activeStatuses }) => {
  if (activeStatuses.length === 0) return null;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        zIndex: 1000, 
        p: 2,
        backgroundColor: 'background.paper',
        opacity: 0.9
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
        Request Status
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {activeStatuses.map(status => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 14, 
                height: 14, 
                borderRadius: '50%', 
                backgroundColor: STATUS_COLORS[status] || '#9e9e9e',
                border: '1px solid rgba(0,0,0,0.2)'
              }} 
            />
            <Typography variant="body2">{status}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
