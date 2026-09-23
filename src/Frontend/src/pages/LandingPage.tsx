import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 15 }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h1" sx={{ color: 'primary.main', mb: 2, fontFamily: 'Outfit' }}>
          Association Management System
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 6 }}>
          The complete platform to manage your cultural association, club, or federation.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 3 }}>
          <Button component={RouterLink} to="/register" variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5 }}>
            Register Your Association
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
