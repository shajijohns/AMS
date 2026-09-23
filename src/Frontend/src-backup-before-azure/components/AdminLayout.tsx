import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  ListItem, ListItemButton, ListItemIcon, ListItemText,
  CssBaseline, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, ListItemSecondaryAction
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const drawerWidth = 240;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [tenantsMenuOpen, setTenantsMenuOpen] = useState(false);
  const [associationOpen, setAssociationOpen] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInvite = async () => {
    try {
      const formData = new FormData();
      formData.append('email', inviteEmail);
      formData.append('message', inviteMessage);
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await fetch('http://localhost:5200/api/admin/associations/invite', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteMessage('');
      setAttachments([]);
      alert("Invitation sent successfully!");
    } catch (error) {
      console.error("Failed to send invite", error);
      alert("Failed to send invite.");
    }
  };

  const handleLogout = async () => {
    await fetch('http://localhost:5200/api/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Association Portal - Admin
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Logged in as Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                selected={location.pathname === '/admin'} 
                onClick={() => navigate('/admin')}
              >
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                selected={location.pathname === '/admin/map'} 
                onClick={() => navigate('/admin/map')}
              >
                <ListItemIcon><PublicIcon /></ListItemIcon>
                <ListItemText primary="Map View" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setAssociationOpen(!associationOpen)}>
                <ListItemIcon><BusinessIcon /></ListItemIcon>
                <ListItemText primary="Association" />
                {associationOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={associationOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton 
                  sx={{ pl: 4 }}
                  selected={location.pathname === '/admin/requests'} 
                  onClick={() => navigate('/admin/requests')}
                >
                  <ListItemIcon><AssignmentIcon /></ListItemIcon>
                  <ListItemText primary="Pending Requests" />
                </ListItemButton>
                
                <ListItemButton 
                  sx={{ pl: 4 }}
                  selected={location.pathname === '/admin/associations'}
                  onClick={() => navigate('/admin/associations')}
                >
                  <ListItemIcon><SearchIcon /></ListItemIcon>
                  <ListItemText primary="Search Association" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemIcon><PersonSearchIcon /></ListItemIcon>
                  <ListItemText primary="Search Association Member" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4 }} onClick={() => setInviteDialogOpen(true)}>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText primary="Invite Association" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemIcon><PersonAddIcon /></ListItemIcon>
                  <ListItemText primary="Add Association Member" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemIcon><GroupWorkIcon /></ListItemIcon>
                  <ListItemText primary="Maintain Committees" />
                </ListItemButton>
                
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
                  <ListItemText primary="Create Association Dues" />
                </ListItemButton>
              </List>
            </Collapse>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setTenantsMenuOpen(!tenantsMenuOpen)}>
                <ListItemIcon><BusinessIcon /></ListItemIcon>
                <ListItemText primary="Tenants" />
                {tenantsMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={tenantsMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/admin/tenants/invite')} selected={location.pathname === '/admin/tenants/invite'}>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText primary="Invite Tenant" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/admin/tenants/add')} selected={location.pathname === '/admin/tenants/add'}>
                  <ListItemIcon><AddCircleIcon /></ListItemIcon>
                  <ListItemText primary="Add Tenant" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/admin/tenants/list')} selected={location.pathname === '/admin/tenants/list'}>
                  <ListItemIcon><ListAltIcon /></ListItemIcon>
                  <ListItemText primary="Tenants List" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/admin/tenants/approve')} selected={location.pathname === '/admin/tenants/approve'}>
                  <ListItemIcon><CheckCircleIcon /></ListItemIcon>
                  <ListItemText primary="Approve Tenants" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/admin/configuration')}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Configuration" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setPasswordDialogOpen(true)}>
                <ListItemIcon><LockIcon /></ListItemIcon>
                <ListItemText primary="Change Password" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        <Outlet />
      </Box>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />

      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invite Association</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Enter the email address and a custom message to send an invitation link to register their association.
          </Typography>
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Custom Message (Optional)"
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
            >
              Attach Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
            {attachments.length > 0 && (
              <List dense sx={{ mt: 1 }}>
                {attachments.map((file, index) => (
                  <ListItem key={index} divider>
                    <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="delete" onClick={() => removeAttachment(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setInviteDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleInvite} 
            color="primary" 
            variant="contained"
            disabled={!inviteEmail.trim() || !inviteEmail.includes('@')}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
