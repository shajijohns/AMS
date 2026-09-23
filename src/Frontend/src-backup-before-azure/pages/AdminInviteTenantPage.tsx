import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Alert, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Collapse 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';

const Row = ({ invite, fetchInvites }: { invite: any, fetchInvites: () => void }) => {
  const [open, setOpen] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch(`http://localhost:5200/api/admin/tenants/invites/${invite.id}/resend`, { 
        method: 'POST',
        credentials: 'include' 
      });
      if (response.ok) {
        fetchInvites();
      } else {
        alert("Failed to resend invite");
      }
    } catch (e) {
      alert("Error resending invite");
    } finally {
      setResending(false);
    }
  };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{invite.email}</TableCell>
        <TableCell>
          <Chip 
            label={invite.status} 
            color={invite.status === 'Accepted' ? 'success' : invite.status === 'Clicked' ? 'primary' : 'default'} 
            size="small" 
          />
        </TableCell>
        <TableCell>{new Date(invite.sentUtc).toLocaleString()}</TableCell>
        <TableCell align="right">
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<SendIcon />} 
            onClick={handleResend}
            disabled={resending || invite.status === 'Accepted'}
          >
            Resend
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Invitation Logs
              </Typography>
              <Table size="small" aria-label="logs">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Original Send Date</strong></TableCell>
                    <TableCell>{new Date(invite.sentUtc).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Resent Count</strong></TableCell>
                    <TableCell>{invite.resentCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Last Resent Date</strong></TableCell>
                    <TableCell>{invite.lastResentUtc ? new Date(invite.lastResentUtc).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Clicked Date</strong></TableCell>
                    <TableCell>{invite.clickedUtc ? new Date(invite.clickedUtc).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Accepted Date</strong></TableCell>
                    <TableCell>{invite.acceptedUtc ? new Date(invite.acceptedUtc).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>Custom Message Sent</strong></TableCell>
                    <TableCell>{invite.message || <em>No custom message provided</em>}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export const AdminInviteTenantPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchInvites = async () => {
    try {
      const response = await fetch('http://localhost:5200/api/admin/tenants/invites', { credentials: 'include' });
      if (response.ok) {
        setInvites(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleSend = async () => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('message', message);
    
    try {
      const response = await fetch('http://localhost:5200/api/admin/tenants/invite', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (response.ok) {
        setSuccess(true);
        setEmail('');
        setMessage('');
        fetchInvites();
        setDialogOpen(false);
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        alert("Failed to send invite");
      }
    } catch (e) {
      alert("Error sending invite");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Invitation History</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Send Invitation
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }}>Invitation sent successfully!</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="50px" />
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date Sent</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.map((invite) => (
              <Row key={invite.id} invite={invite} fetchInvites={fetchInvites} />
            ))}
            {invites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No invitations sent yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Association</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Enter the email address and a custom message to send an invitation link to register their association.
          </Typography>
          <TextField 
            fullWidth 
            label="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            sx={{ mb: 3 }} 
          />
          <TextField 
            fullWidth 
            label="Custom Message (Optional)" 
            multiline 
            rows={4} 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend} disabled={!email}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
