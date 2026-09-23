import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, CircularProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, Box,
  TextField, IconButton, Tooltip, TableSortLabel, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { RequestDetailsDialog } from '../components/RequestDetailsDialog';

interface RequestData {
  id: string;
  status: number;
  submittedByEmail: string;
  tenantUniqueId: string;
  createdUtc: string;
  payloadJson: string;
}

type Order = 'asc' | 'desc';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof RequestData>('createdUtc');
  const [order, setOrder] = useState<Order>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [moreInfoDialogOpen, setMoreInfoDialogOpen] = useState(false);
  const [moreInfoRequestId, setMoreInfoRequestId] = useState<string | null>(null);
  const [moreInfoMessage, setMoreInfoMessage] = useState('');
  const [disapproveDialogOpen, setDisapproveDialogOpen] = useState(false);
  const [disapproveRequestId, setDisapproveRequestId] = useState<string | null>(null);
  const [disapproveReason, setDisapproveReason] = useState('');
  
  const navigate = useNavigate();

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/admin/association-requests', { credentials: 'include' })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          navigate('/admin/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setRequests(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error("Error fetching requests:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, [navigate]);

  const handleAction = async (id: string, action: 'approve' | 'more-info' | 'reject' | 'disapprove', payload?: any) => {
    try {
      const response = await fetch(`/api/admin/association-requests/${id}/${action}`, {
        method: 'POST',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
        credentials: 'include'
      });
      if (response.ok) {
        fetchRequests();
      } else {
        alert("Action failed");
      }
    } catch(err) {
      console.error(err);
      alert("Network error");
    }
  };

  const getStatusLabel = (status: number) => {
    // 0: Submitted, 1: UnderReview, 2: MoreInfoRequested, 3: Approved, 4: Rejected, 5: Draft
    switch(status) {
      case 0: return <Chip label="Submitted" color="primary" size="small" />;
      case 1: return <Chip label="Under Review" color="secondary" size="small" />;
      case 2: return <Chip label="More Info Req" color="warning" size="small" />;
      case 3: return <Chip label="Approved" color="success" size="small" />;
      case 4: return <Chip label="Rejected" color="error" size="small" />;
      case 5: return <Chip label="Draft" color="default" size="small" />;
      default: return <Chip label="Unknown" size="small" />;
    }
  };

  const parseAssociationName = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      return data?.AssociationName || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const handleRequestSort = (property: keyof RequestData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter & Sort Logic
  const filteredAndSortedRequests = useMemo(() => {
    // 1. Filter
    let result = requests.filter(req => {
      const lowerQuery = searchQuery.toLowerCase();
      const assocName = parseAssociationName(req.payloadJson).toLowerCase();
      return (
        assocName.includes(lowerQuery) ||
        req.submittedByEmail.toLowerCase().includes(lowerQuery) ||
        (req.tenantUniqueId && req.tenantUniqueId.toLowerCase().includes(lowerQuery))
      );
    });

    // 2. Sort
    result = result.sort((a, b) => {
      let valA: any = a[orderBy];
      let valB: any = b[orderBy];

      if (orderBy === 'payloadJson') { // Sort by Association Name
        valA = parseAssociationName(a.payloadJson).toLowerCase();
        valB = parseAssociationName(b.payloadJson).toLowerCase();
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [requests, searchQuery, orderBy, order]);

  if (loading && requests.length === 0) {
    return (
      <Container sx={{ mt: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Association Requests
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search requests..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: 300, bgcolor: 'white', borderRadius: 1, '& .MuiInputBase-root': { color: 'black' } }}
        />
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }} aria-label="requests table" size="medium">
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'payloadJson'}
                  direction={orderBy === 'payloadJson' ? order : 'asc'}
                  onClick={() => handleRequestSort('payloadJson')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Association Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'tenantUniqueId'}
                  direction={orderBy === 'tenantUniqueId' ? order : 'asc'}
                  onClick={() => handleRequestSort('tenantUniqueId')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Tenant ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'submittedByEmail'}
                  direction={orderBy === 'submittedByEmail' ? order : 'asc'}
                  onClick={() => handleRequestSort('submittedByEmail')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Contact Email
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'createdUtc'}
                  direction={orderBy === 'createdUtc' ? order : 'asc'}
                  onClick={() => handleRequestSort('createdUtc')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Date Submitted
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                  sx={{ '&.MuiTableSortLabel-active': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No requests found matching your search.</TableCell>
              </TableRow>
            ) : (
              filteredAndSortedRequests.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell component="th" scope="row">{parseAssociationName(row.payloadJson)}</TableCell>
                  <TableCell>{row.tenantUniqueId || 'N/A'}</TableCell>
                  <TableCell>{row.submittedByEmail}</TableCell>
                  <TableCell>{new Date(row.createdUtc).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusLabel(row.status)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => {
                          setSelectedRequest(row);
                          setDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {row.status === 3 ? (
                      <Tooltip title="Disapprove">
                        <IconButton color="error" size="small" onClick={() => {
                          setDisapproveRequestId(row.id);
                          setDisapproveReason('');
                          setDisapproveDialogOpen(true);
                        }}>
                          <ThumbDownIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Approve">
                        <IconButton color="success" size="small" onClick={() => handleAction(row.id, 'approve')}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={row.status === 3 ? "Cannot request more info on approved request" : "Request More Info"}>
                      <span>
                        <IconButton 
                          color="warning" 
                          size="small" 
                          onClick={() => {
                            setMoreInfoRequestId(row.id);
                            setMoreInfoMessage('');
                            setMoreInfoDialogOpen(true);
                          }}
                          disabled={row.status === 3}
                        >
                          <InfoIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Deactivate/Reject">
                      <IconButton color="error" size="small" onClick={() => handleAction(row.id, 'reject')}>
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RequestDetailsDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        requestData={selectedRequest}
      />

      <Dialog open={moreInfoDialogOpen} onClose={() => setMoreInfoDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Request More Information</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Enter the details you need from the association. An email will be sent to the contact address.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={moreInfoMessage}
            onChange={(e) => setMoreInfoMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setMoreInfoDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={() => {
              if (moreInfoRequestId) {
                handleAction(moreInfoRequestId, 'more-info', { message: moreInfoMessage });
              }
              setMoreInfoDialogOpen(false);
            }} 
            color="primary" 
            variant="contained"
            disabled={!moreInfoMessage.trim()}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={disapproveDialogOpen} onClose={() => setDisapproveDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Disapprove Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Please provide a reason for disapproving this request.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={disapproveReason}
            onChange={(e) => setDisapproveReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDisapproveDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={() => {
              if (disapproveRequestId) {
                handleAction(disapproveRequestId, 'disapprove', { reason: disapproveReason });
              }
              setDisapproveDialogOpen(false);
            }} 
            color="error" 
            variant="contained"
            disabled={!disapproveReason.trim()}
          >
            Disapprove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
