import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  status: number;
}

export const MemberRosterPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', membershipType: 'Individual' });

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Invitation link (simulated email): ${data.invitationLink}`);
        setOpen(false);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Member Roster</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Seed New Member</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <TableCell>Member #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.memberNumber}</TableCell>
                  <TableCell>{m.lastName}, {m.firstName}</TableCell>
                  <TableCell>{m.status === 0 ? 'Invited' : m.status === 1 ? 'Registered' : 'Active'}</TableCell>
                  <TableCell align="right">
                    {m.status === 0 && <Button size="small" variant="outlined">Resend Invite</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No members found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seed New Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
          <TextField label="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
          <TextField label="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSeed}>Seed & Invite</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
