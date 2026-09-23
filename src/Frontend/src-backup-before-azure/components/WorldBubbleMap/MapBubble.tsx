import React from 'react';
import { CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import { Box, Typography, Divider } from '@mui/material';
import type { WorldMapLocation } from './types';
import { STATUS_COLORS } from './types';

interface MapBubbleProps {
  location: WorldMapLocation;
}

export const MapBubble: React.FC<MapBubbleProps> = ({ location }) => {
  const map = useMap();
  
  // Base bubble size on square root of count for proportional scaling
  const radius = Math.max(8, Math.sqrt(location.count) * 4);
  
  // Determine primary status color (pick the one with highest count)
  let primaryStatus = 'Submitted';
  let maxCount = 0;
  Object.entries(location.statuses).forEach(([status, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryStatus = status;
    }
  });
  
  const color = STATUS_COLORS[primaryStatus] || '#9e9e9e';

  const handleClick = () => {
    // Zoom into the region when clicked
    map.flyTo([location.latitude, location.longitude], 6, {
      duration: 1.5
    });
  };

  return (
    <CircleMarker
      center={[location.latitude, location.longitude]}
      radius={radius}
      pathOptions={{
        color: '#ffffff',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.7,
      }}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Tooltip direction="top" offset={[0, -radius]} opacity={0.9}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {location.region}, {location.country}
        </Typography>
        <Typography variant="caption">
          Total Requests: {location.count}
        </Typography>
      </Tooltip>
      
      <Popup>
        <Box sx={{ minWidth: 150 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
            {location.region}, {location.country}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Total Requests: <strong>{location.count}</strong>
          </Typography>
          <Divider sx={{ my: 1 }} />
          {Object.entries(location.statuses).map(([status, count]) => (
            <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, height: 8, borderRadius: '50%', 
                    backgroundColor: STATUS_COLORS[status] || '#9e9e9e' 
                  }} 
                />
                <Typography variant="caption">{status}</Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{count}</Typography>
            </Box>
          ))}
        </Box>
      </Popup>
    </CircleMarker>
  );
};
