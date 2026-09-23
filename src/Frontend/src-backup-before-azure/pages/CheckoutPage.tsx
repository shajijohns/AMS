import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Button, TextField, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

export const CheckoutPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5200/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          cardToken: cardNumber // Passing card number as mock token
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Payment failed.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/ledger');
        }, 3000);
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h4" color="success.main" gutterBottom>Payment Successful!</Typography>
        <Typography variant="body1">Thank you for your payment. You are being redirected...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.light' }}>
          Secure Checkout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your payment details below.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handlePayment}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField 
              label="Card Number" 
              fullWidth 
              value={cardNumber} 
              onChange={e => setCardNumber(e.target.value)} 
              helperText="Type 'fail' to simulate a declined card."
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="MM/YY" 
                value={expiry} 
                onChange={e => setExpiry(e.target.value)} 
                sx={{ flex: 1 }}
                required
              />
              <TextField 
                label="CVV" 
                value={cvv} 
                onChange={e => setCvv(e.target.value)} 
                sx={{ flex: 1 }}
                required
              />
            </Box>

            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large" 
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Process Payment'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};
