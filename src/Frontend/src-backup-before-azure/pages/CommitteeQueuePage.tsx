import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Box } from '@mui/material';

interface AssociationRequest {
  id: string;
  status: number;
  submittedByEmail: string;
  payloadJson: string;
  createdUtc: string;
}

export const CommitteeQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<AssociationRequest[]>([]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5200/api/committee/requests');
      if (response.ok) {
        setRequests(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5200/api/committee/requests/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Committee Review Queue
      </Typography>
      <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <TableCell>Date</TableCell>
                <TableCell>Contact Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{new Date(req.createdUtc).toLocaleDateString()}</TableCell>
                  <TableCell>{req.submittedByEmail}</TableCell>
                  <TableCell>
                    <Chip 
                      label={req.status === 0 ? 'Submitted' : req.status === 3 ? 'Approved' : 'Other'} 
                      color={req.status === 0 ? 'warning' : req.status === 3 ? 'success' : 'default'}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {req.status === 0 && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success" onClick={() => handleApprove(req.id)}>Approve</Button>
                        <Button size="small" variant="outlined" color="error">Reject</Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>No requests found in the queue.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};
