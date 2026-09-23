import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, Box, Tabs, Tab } from '@mui/material';
import { InvoiceCard } from '../components/InvoiceCard';
import { useNavigate } from 'react-router-dom';

export const MemberLedgerPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // Hardcode a mock member for now, simulating logged in user
  const mockUserId = '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    fetch(`http://localhost:5200/api/billing/invoices?mockUserId=${mockUserId}`)
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`http://localhost:5200/api/billing/history?mockUserId=${mockUserId}`)
      .then(res => res.json())
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const handlePay = (id: string) => {
    navigate(`/checkout/${id}`);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.light' }}>
          Billing & Dues
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Outstanding Invoices" />
            <Tab label="Payment History" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Box>
            {invoices.filter(i => i.status !== 2).length === 0 ? (
              <Typography color="text.secondary">No outstanding invoices. You're all caught up!</Typography>
            ) : (
              invoices.filter(i => i.status !== 2).map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} onPay={handlePay} />
              ))
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {history.length === 0 ? (
              <Typography color="text.secondary">No past payments found.</Typography>
            ) : (
              history.map(p => (
                <Paper key={p.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ${p.amount.toFixed(2)} Paid
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        Ref: {p.gatewayTransactionId}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))
            )}
          </Box>
        )}

      </Paper>
    </Container>
  );
};
