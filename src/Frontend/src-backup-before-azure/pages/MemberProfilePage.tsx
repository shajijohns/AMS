import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, TextField, Grid, Divider } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

export const MemberProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [profileData, setProfileData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5200/api/me/profile?mockUserId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setPhone(data.profile.phone || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5200/api/me/profile?mockUserId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setEditing(false);
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!profileData) return <Typography align="center" sx={{ mt: 10 }}>Loading Profile...</Typography>;

  const { profile, family } = profileData;

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>My Membership Profile</Typography>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="primary.light">Personal Details</Typography>
          <Button variant="outlined" size="small" onClick={() => editing ? handleSave() : setEditing(true)}>
            {editing ? 'Save Changes' : 'Edit Contact Info'}
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography variant="body1">{profile.firstName} {profile.lastName}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Member Number</Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{profile.memberNumber}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{profile.email}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            {editing ? (
              <TextField size="small" value={phone} onChange={e => setPhone(e.target.value)} />
            ) : (
              <Typography variant="body1">{profile.phone || 'Not provided'}</Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Membership Type</Typography>
            <Typography variant="body1">{profile.membershipType}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Typography variant="body1" color={profile.status === 3 ? "success.main" : "warning.main"}>
              {profile.status === 3 ? 'Active' : profile.status === 1 ? 'Registered' : 'Other'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h6" color="primary.light" sx={{ mb: 2 }}>Family Members</Typography>
        {family.length === 0 ? (
          <Typography color="text.secondary">No family members linked.</Typography>
        ) : (
          family.map((fm: any, idx: number) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}><Typography variant="body1">{fm.name}</Typography></Grid>
                <Grid size={{ xs: 4 }}><Typography color="text.secondary">{fm.relationship}</Typography></Grid>
                <Grid size={{ xs: 4 }}><Typography color="text.secondary">DOB: {fm.dob}</Typography></Grid>
              </Grid>
              {idx < family.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))
        )}
      </Paper>
    </Container>
  );
};
