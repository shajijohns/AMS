import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button, Divider } from '@mui/material';

interface InvoiceCardProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    status: number; // 0=Draft, 1=Open, 2=Paid, 3=Void, 4=Overdue
    issueDate: string;
    dueDate: string;
  };
  onPay?: (id: string) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onPay }) => {
  const isPaid = invoice.status === 2;
  const isOverdue = invoice.status === 4;

  const statusLabel = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Open';
  const statusColor = isPaid ? 'success' : isOverdue ? 'error' : 'warning';

  return (
    <Card sx={{ borderRadius: 3, mb: 2, background: 'background.paper', borderLeft: `4px solid ${isPaid ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b'}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{invoice.invoiceNumber}</Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>
        <Typography color="text.secondary" gutterBottom>{invoice.description}</Typography>
        
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Issued: {new Date(invoice.issueDate).toLocaleDateString()}</Typography>
            <Typography variant="body2" color="text.secondary">Due: {new Date(invoice.dueDate).toLocaleDateString()}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color={isPaid ? "text.primary" : "primary.main"} sx={{ fontWeight: 600 }}>
              ${invoice.amountDue.toFixed(2)} {invoice.currency}
            </Typography>
            {invoice.amountPaid > 0 && <Typography variant="caption" color="success.main">Paid: ${invoice.amountPaid.toFixed(2)}</Typography>}
          </Box>
        </Box>

        {(!isPaid && onPay) && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" onClick={() => onPay(invoice.id)}>
              Pay Now
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
