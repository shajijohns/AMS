import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, Box, CircularProgress, Button, Chip, Divider, List, ListItem, ListItemText, IconButton, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { WorldBubbleMap } from '../components/WorldBubbleMap/WorldBubbleMap';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch real stats, fallback to extensive mock data if backend isn't ready
    Promise.all([
      fetch('http://localhost:5200/api/dashboard/stats', { credentials: 'include' }).then(res => res.json()),
      fetch('http://localhost:5200/api/dashboard/world-map', { credentials: 'include' }).then(res => res.json())
    ])
      .then(([statsData, worldMapData]) => {
        setStats(statsData);
        setMapData(worldMapData);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend unavailable, using mock data for dashboard", err);
        setStats({
          totalAssociations: 42,
          associationsDelta: 3,
          totalMembers: 1250,
          membersGrowthPct: 5.2,
          totalRevenue: 52000.50,
          revenueTrend: 'up',
          pendingApprovals: 8,
          overdueDues: 4500.00,
          activeEvents: 12,
          recentRegistrations: [
            { id: 1, name: 'Dental Association of NY', type: 'Association', status: 'Pending', createdUtc: '2026-09-10T10:00:00Z' },
            { id: 2, name: 'Midwest Orthodontics', type: 'Business', status: 'Approved', createdUtc: '2026-09-09T14:30:00Z' }
          ],
          memberGrowthData: [
            { name: 'Jan', members: 400, new: 50 },
            { name: 'Feb', members: 600, new: 200 },
            { name: 'Mar', members: 800, new: 200 },
            { name: 'Apr', members: 1000, new: 200 },
            { name: 'May', members: 1150, new: 150 },
            { name: 'Jun', members: 1250, new: 100 },
          ],
          revenueTrendData: [
            { month: 'Jan', collected: 5000, expected: 5200 },
            { month: 'Feb', collected: 6000, expected: 6000 },
            { month: 'Mar', collected: 7500, expected: 7000 },
            { month: 'Apr', collected: 8000, expected: 8500 },
            { month: 'May', collected: 11000, expected: 10000 },
            { month: 'Jun', collected: 14500, expected: 14000 },
          ],
          membershipByTenantType: [
            { name: 'Association', value: 800 },
            { name: 'Nonprofit', value: 300 },
            { name: 'Church', value: 150 },
          ],
          topAssociations: [
            { name: 'NY Dental', members: 240 },
            { name: 'CA Med Society', members: 210 },
            { name: 'TX Teachers', members: 180 },
            { name: 'FL Realtors', members: 150 },
            { name: 'IL Bar Assoc', members: 120 },
          ],
          renewalRateData: [
            { period: 'Q1', renewed: 400, lapsed: 50 },
            { period: 'Q2', renewed: 350, lapsed: 80 },
            { period: 'Q3', renewed: 450, lapsed: 40 },
          ],
          geographicDistribution: [
            { state: 'United States', members: 300 },
            { state: 'Canada', members: 250 },
            { state: 'United Kingdom', members: 200 },
            { state: 'Germany', members: 150 },
            { state: 'Australia', members: 100 },
          ],
          marketLocations: [],
          pendingTenantApprovals: [
            { id: 3, name: 'WA Pilots Assoc', type: 'Association', submitted: '2026-09-12' },
            { id: 4, name: 'OR Nurses', type: 'Nonprofit', submitted: '2026-09-13' }
          ],
          expiringMemberships: [
            { id: 101, name: 'John Doe', association: 'NY Dental', expires: '2026-09-20' },
            { id: 102, name: 'Jane Smith', association: 'TX Teachers', expires: '2026-09-25' }
          ],
          failedPayments: [
            { id: 201, name: 'Alice Brown', amount: 150, date: '2026-09-10', reason: 'Card Expired' }
          ],
          openDsrs: [
            { id: 301, user: 'Bob Wilson', type: 'Deletion', due: '2026-09-18', daysOld: 25 }
          ],
          upcomingEvents: [
            { id: 401, name: 'Annual Conference', date: '2026-10-01', association: 'NY Dental' },
            { id: 402, name: 'Fall Seminar', date: '2026-10-15', association: 'CA Med Society' }
          ],
          recentActivity: [
            { id: 501, text: 'Admin approved member Jane Smith', time: '2 hours ago' },
            { id: 502, text: 'Payment $150 received from Bob Wilson', time: '4 hours ago' },
            { id: 503, text: 'Midwest Orthodontics registered', time: '1 day ago' }
          ],
          recentPayments: [
            { id: 601, user: 'Alice', amount: 50, date: '2026-09-14' },
            { id: 602, user: 'Bob', amount: 150, date: '2026-09-13' }
          ],
          auditSummary: { loginsToday: 45, adminActions: 12 },
          emailSmsStatus: { sent: 1200, bounced: 15, failed: 5 }
        });
        setLoading(false);
      });
  }, []);

  const handleExportData = () => {
    alert('Data export request initiated for GDPR compliance.');
  };

  if (loading || !stats) {
    return (
      <Container sx={{ mt: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a83279'];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 4 }}>
        Federation Dashboard
      </Typography>

      {/* --- KPI STAT CARDS (TOP ROW) --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #1976d2' }}>
            <Typography variant="subtitle2" color="text.secondary">Total Associations</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalAssociations}</Typography>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium', mb: 0.5 }}>+{stats.associationsDelta} this mo</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #9c27b0' }}>
            <Typography variant="subtitle2" color="text.secondary">Total Members</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalMembers}</Typography>
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> {stats.membersGrowthPct}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #2e7d32' }}>
            <Typography variant="subtitle2" color="text.secondary">Total Revenue (YTD)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>${(stats.totalRevenue/1000).toFixed(1)}k</Typography>
              {stats.revenueTrend === 'up' ? 
                <TrendingUpIcon color="success" fontSize="small" sx={{ mb: 0.5 }} /> : 
                <TrendingDownIcon color="error" fontSize="small" sx={{ mb: 0.5 }} />}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #ed6c02', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} onClick={() => window.location.href='/admin/requests'}>
            <Typography variant="subtitle2" color="text.secondary">Pending Approvals</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{stats.pendingApprovals}</Typography>
              <Typography variant="body2" color="error.main" sx={{ mb: 0.5 }}>Needs action</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #d32f2f' }}>
            <Typography variant="subtitle2" color="text.secondary">Overdue Dues</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main', mt: 1 }}>
              ${stats.overdueDues.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderTop: '4px solid #0288d1' }}>
            <Typography variant="subtitle2" color="text.secondary">Active Events (Mo)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
              {stats.activeEvents}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* --- CHARTS SECTION --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Member Growth</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={stats.memberGrowthData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="new" name="New Members" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="members" name="Total Members" stroke="#ff7300" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={stats.revenueTrendData}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="expected" name="Expected" fill="#f5f5f5" stroke="#ccc" />
                <Bar dataKey="collected" name="Collected" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Membership by Type</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={stats.membershipByTenantType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {stats.membershipByTenantType.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* --- ROW 2: World Market --- */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6">World Market</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>Worldwide data visualization</Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ width: '100%', height: 450, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <WorldBubbleMap data={mapData} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Information</Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {mapData.map((loc: any) => (
                    <React.Fragment key={`${loc.country}-${loc.region}`}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary={<Typography variant="body2">{loc.region}, {loc.country}</Typography>} 
                          secondary={<Typography variant="caption" color="text.secondary">{loc.count} Requests</Typography>}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- ROW 3: Organizations Map & Others --- */}

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Top 10 Associations</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.topAssociations} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="members" name="Members" fill="#1976d2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Renewal Rate</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.renewalRateData}>
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="renewed" stackId="a" fill="#4caf50" name="Renewed" />
                <Bar dataKey="lapsed" stackId="a" fill="#f44336" name="Lapsed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* --- ACTION QUEUES & LISTS --- */}
      <Grid container spacing={3}>
        {/* Action / Queue */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="warning" /> Pending Approvals
            </Typography>
            <List disablePadding>
              {stats.pendingTenantApprovals.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem alignItems="flex-start" disablePadding sx={{ py: 1.5 }}>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>} 
                      secondary={<Typography variant="caption">{item.type} • Submitted {item.submitted}</Typography>} 
                    />
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <IconButton size="small" color="success"><CheckCircleIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error"><CancelIcon fontSize="small" /></IconButton>
                    </Box>
                  </ListItem>
                  {i < stats.pendingTenantApprovals.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Registrations</Typography>
            <List disablePadding>
              {stats.recentRegistrations.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>} 
                      secondary={new Date(item.createdUtc).toLocaleDateString()}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={item.type} size="small" sx={{ mb: 0.5, display: 'block', fontSize: '0.65rem' }} />
                      <Chip label={item.status} size="small" color={item.status === 'Approved' ? 'success' : 'default'} sx={{ fontSize: '0.65rem' }} />
                    </Box>
                  </ListItem>
                  {i < stats.recentRegistrations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom color="error.main">Failed Payments</Typography>
            <List disablePadding>
              {stats.failedPayments.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{`${item.name} - $${item.amount}`}</Typography>} 
                      secondary={`${item.reason} • ${item.date}`}
                    />
                  </ListItem>
                  {i < stats.failedPayments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Activity & Events */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
            <List disablePadding>
              {stats.upcomingEvents.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>} 
                      secondary={`${item.association} • ${item.date}`}
                    />
                  </ListItem>
                  {i < stats.upcomingEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Activity Feed</Typography>
            <List disablePadding>
              {stats.recentActivity.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText 
                      primary={<Typography variant="body2">{item.text}</Typography>} 
                      secondary={<Typography variant="caption">{item.time}</Typography>}
                    />
                  </ListItem>
                  {i < stats.recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Expiring Memberships (30d)</Typography>
            <List disablePadding>
              {stats.expiringMemberships.map((item: any, i: number) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary={<Typography variant="body2">{item.name}</Typography>} 
                      secondary={`${item.association} • Expires ${item.expires}`}
                    />
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontSize: '0.7rem' }}>Send Reminder</Button>
                  </ListItem>
                  {i < stats.expiringMemberships.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System / Compliance */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #e0e0e0', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsActiveIcon color="primary" /> GDPR Compliance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Open Data Subject Requests</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.openDsrs.length}</Typography>
              {stats.openDsrs.length > 0 && (
                <Typography variant="caption" color="error.main">Oldest request: {stats.openDsrs[0].daysOld} days old</Typography>
              )}
            </Box>
            {stats.openDsrs.map((dsr: any) => (
              <Box key={dsr.id} sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px solid #eee' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{dsr.user} ({dsr.type})</Typography>
                <Typography variant="caption" color="text.secondary">Due: {dsr.due}</Typography>
              </Box>
            ))}
            <Button variant="contained" color="primary" fullWidth onClick={handleExportData} size="small">
              Export User Data
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Audit Log Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Logins Today</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.auditSummary.loginsToday}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Admin Actions</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.auditSummary.adminActions}</Typography>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Delivery Status (Today)</Typography>
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Sent ({stats.emailSmsStatus.sent})</Typography>
              </Box>
              <LinearProgress variant="determinate" value={100} color="success" />
            </Box>
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Bounced ({stats.emailSmsStatus.bounced})</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(stats.emailSmsStatus.bounced / stats.emailSmsStatus.sent) * 100} color="warning" />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Failed ({stats.emailSmsStatus.failed})</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(stats.emailSmsStatus.failed / stats.emailSmsStatus.sent) * 100} color="error" />
            </Box>
          </Paper>


        </Grid>
      </Grid>
    </Container>
  );
};
