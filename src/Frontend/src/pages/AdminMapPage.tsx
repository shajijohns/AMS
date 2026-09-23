import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, CircularProgress, Card, CardContent } from '@mui/material';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { HubConnectionBuilder } from '@microsoft/signalr';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapLocation {
  name: string;
  coordinates: [number, number];
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
}

export const AdminMapPage: React.FC = () => {
  const [data, setData] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseWithCreds = await fetch('/api/dashboard/map-data', {
          credentials: 'include'
        });

        if (!responseWithCreds.ok) {
          throw new Error('Failed to fetch map data');
        }

        const result = await responseWithCreds.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const connection = new HubConnectionBuilder()
      .withUrl('/api/hubs/map')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to MapHub');
        connection.on('MapDataUpdated', (updatedData: MapLocation[]) => {
          console.log('Received updated map data', updatedData);
          setData(updatedData);
        });
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, []);

  // Use scaleSqrt to size the bubbles proportionally to the area
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return 10;
    return Math.max(...data.map(d => Math.max(d.approvedCount, d.pendingCount)));
  }, [data]);

  const sizeScale = scaleSqrt()
    .domain([0, maxCount])
    .range([0, 30]); // Max radius is 30px

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Organizations Map
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
          <CardContent>
            <Typography variant="h6" color="#4caf50">Approved</Typography>
            <Typography variant="h4">{data.reduce((acc, curr) => acc + curr.approvedCount, 0)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}>
          <CardContent>
            <Typography variant="h6" color="#ff9800">Pending</Typography>
            <Typography variant="h4">{data.reduce((acc, curr) => acc + curr.pendingCount, 0)}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ flex: 1, overflow: 'hidden', position: 'relative', borderRadius: 2, bgcolor: '#1a1d24' }}>
        <ComposableMap projection="geoMercator" style={{ width: '100%', height: '100%' }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#2c313c"
                  stroke="#404654"
                  strokeWidth={0.5}
                />
              ))
            }
          </Geographies>

          {data.map((location, i) => {
            // Draw pending and approved bubbles
            // To prevent complete overlap, we can draw the larger one first, or offset slightly
            const approvedRadius = sizeScale(location.approvedCount);
            const pendingRadius = sizeScale(location.pendingCount);

            return (
              <Marker key={`${location.name}-${i}`} coordinates={location.coordinates}>
                <g>
                  {/* Draw the larger circle first to avoid hiding the smaller one */}
                  {location.pendingCount >= location.approvedCount && location.pendingCount > 0 && (
                    <circle
                      r={pendingRadius}
                      fill="rgba(255, 152, 0, 0.7)"
                      stroke="#ff9800"
                      strokeWidth={1.5}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  )}
                  {location.approvedCount > 0 && (
                    <circle
                      r={approvedRadius}
                      fill="rgba(76, 175, 80, 0.7)"
                      stroke="#4caf50"
                      strokeWidth={1.5}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  )}
                  {location.pendingCount < location.approvedCount && location.pendingCount > 0 && (
                    <circle
                      r={pendingRadius}
                      fill="rgba(255, 152, 0, 0.7)"
                      stroke="#ff9800"
                      strokeWidth={1.5}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  )}
                  <text
                    textAnchor="middle"
                    y={-Math.max(approvedRadius, pendingRadius) - 5}
                    style={{ fontFamily: 'system-ui', fill: '#fff', fontSize: '10px', pointerEvents: 'none' }}
                  >
                    {location.name}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </Paper>
    </Box>
  );
};
