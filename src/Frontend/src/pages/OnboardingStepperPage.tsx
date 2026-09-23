import React, { useState } from 'react';
import { Box, Button, Container, Paper, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const steps = ['Association Identity', 'Legal & Registration', 'Executive Committee'];

export const OnboardingStepperPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    legalName: '',
    ein: '',
    stateRegNumber: '',
    stateOfIncorporation: '',
    officers: [{ title: 'President', name: '', email: '', phone: '' }]
  });

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/onboarding/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setActiveStep(steps.length);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
          Complete Association Profile
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary" gutterBottom>All Setup Completed!</Typography>
            <Typography>Your association is now Active. You can proceed to the dashboard to invite members.</Typography>
            <Button variant="contained" sx={{ mt: 4 }}>Go to Dashboard</Button>
          </Box>
        ) : (
          <Box>
            {activeStep === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField label="Legal Name" fullWidth value={formData.legalName} onChange={(e) => setFormData({...formData, legalName: e.target.value})} />
              </Box>
            )}
            
            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField label="EIN (Employer Identification Number)" fullWidth value={formData.ein} onChange={(e) => setFormData({...formData, ein: e.target.value})} />
                <TextField label="State Registration Number" fullWidth value={formData.stateRegNumber} onChange={(e) => setFormData({...formData, stateRegNumber: e.target.value})} />
                <TextField label="State of Incorporation" fullWidth value={formData.stateOfIncorporation} onChange={(e) => setFormData({...formData, stateOfIncorporation: e.target.value})} />
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6">Add Primary Officer</Typography>
                <TextField label="Title" value={formData.officers[0].title} disabled fullWidth />
                <TextField label="Name" fullWidth value={formData.officers[0].name} onChange={(e) => setFormData({...formData, officers: [{...formData.officers[0], name: e.target.value}]})} />
                <TextField label="Email" fullWidth value={formData.officers[0].email} onChange={(e) => setFormData({...formData, officers: [{...formData.officers[0], email: e.target.value}]})} />
                <TextField label="Phone" fullWidth value={formData.officers[0].phone} onChange={(e) => setFormData({...formData, officers: [{...formData.officers[0], phone: e.target.value}]})} />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
                {activeStep === steps.length - 1 ? 'Finish Setup' : 'Next'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
