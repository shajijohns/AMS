import React, { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Box, CircularProgress, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

import type { WorldMapLocation } from './types';
import { MapBubble } from './MapBubble';
import { MapLegend } from './MapLegend';

interface WorldBubbleMapProps {
  data: WorldMapLocation[];
  loading?: boolean;
  error?: string | null;
}

export const WorldBubbleMap: React.FC<WorldBubbleMapProps> = ({ data, loading, error }) => {
  // Extract unique statuses for the legend
  const activeStatuses = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach(loc => {
      Object.keys(loc.statuses).forEach(status => statuses.add(status));
    });
    return Array.from(statuses);
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%', bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%', bgcolor: '#fdecea', borderRadius: 1 }}>
        <Typography color="error">Error loading map data: {error}</Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%', bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography color="text.secondary">No geographic data available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '400px', width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Sort data by count descending so smaller bubbles are rendered last (on top) */}
        {data
          .sort((a, b) => b.count - a.count)
          .map((location, idx) => (
            <MapBubble key={`${location.country}-${location.region}-${idx}`} location={location} />
        ))}
      </MapContainer>
      
      <MapLegend activeStatuses={activeStatuses} />
    </Box>
  );
};
