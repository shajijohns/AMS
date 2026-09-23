import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Step, StepLabel, Stepper, TextField, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

const steps = ['Personal Details', 'Family Details', 'Consents'];

export const MemberWizardPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    password: '',
    dob: '',
    phone: '',
    address: { street: '', city: '', zip: '' },
    familyMembers: [] as any[],
    consents: { privacyPolicy: false, dataProcessing: false, marketing: false, directoryVisibility: false }
  });

  useEffect(() => {
    // Validate token
    fetch(`/api/invitations/${token}/validate`)
      .then(res => {
        if (res.ok) setIsValid(true);
        else setIsValid(false);
      });
  }, [token]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        // Redirect to profile with mock user id for demo
        navigate(`/profile?userId=${data.userId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isValid === false) return <Typography align="center" sx={{ mt: 10 }}>Invalid or Expired Invitation Link.</Typography>;
  if (isValid === null) return <Typography align="center" sx={{ mt: 10 }}>Validating...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
          Complete Your Membership
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        <Box>
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField label="Set Password" type="password" fullWidth value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <TextField label="Date of Birth (YYYY-MM-DD)" fullWidth value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              <TextField label="Phone Number" fullWidth value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <Typography variant="h6">Address</Typography>
              <TextField label="Street" fullWidth value={formData.address.street} onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="City" fullWidth value={formData.address.city} onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                <TextField label="Zip" fullWidth value={formData.address.zip} onChange={(e) => setFormData({...formData, address: {...formData.address, zip: e.target.value}})} />
              </Box>
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body1">Optional: Add family members linked to your membership.</Typography>
              <Button variant="outlined" onClick={() => setFormData({...formData, familyMembers: [...formData.familyMembers, { name: '', relationship: 'Spouse', dob: '' }]})}>
                Add Family Member
              </Button>
              {formData.familyMembers.map((fm, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, p: 2, border: '1px solid #334155', borderRadius: 2 }}>
                  <TextField label="Name" size="small" value={fm.name} onChange={(e) => { const newFm = [...formData.familyMembers]; newFm[idx].name = e.target.value; setFormData({...formData, familyMembers: newFm}); }} />
                  <TextField label="Relationship" size="small" value={fm.relationship} onChange={(e) => { const newFm = [...formData.familyMembers]; newFm[idx].relationship = e.target.value; setFormData({...formData, familyMembers: newFm}); }} />
                  <TextField label="DOB" size="small" value={fm.dob} onChange={(e) => { const newFm = [...formData.familyMembers]; newFm[idx].dob = e.target.value; setFormData({...formData, familyMembers: newFm}); }} />
                </Box>
              ))}
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Permissions & Consents</Typography>
              <FormControlLabel control={<Checkbox checked={formData.consents.privacyPolicy} onChange={(e) => setFormData({...formData, consents: {...formData.consents, privacyPolicy: e.target.checked}})} />} label="I accept the Privacy Policy (Required)" />
              <FormControlLabel control={<Checkbox checked={formData.consents.dataProcessing} onChange={(e) => setFormData({...formData, consents: {...formData.consents, dataProcessing: e.target.checked}})} />} label="I consent to the processing of my data (Required)" />
              <FormControlLabel control={<Checkbox checked={formData.consents.marketing} onChange={(e) => setFormData({...formData, consents: {...formData.consents, marketing: e.target.checked}})} />} label="I agree to receive marketing communications (Optional)" />
              <FormControlLabel control={<Checkbox checked={formData.consents.directoryVisibility} onChange={(e) => setFormData({...formData, consents: {...formData.consents, directoryVisibility: e.target.checked}})} />} label="Make my profile visible in the Member Directory (Optional)" />
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            <Button variant="contained" 
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={activeStep === 2 && (!formData.consents.privacyPolicy || !formData.consents.dataProcessing)}>
              {activeStep === steps.length - 1 ? 'Complete Registration' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
