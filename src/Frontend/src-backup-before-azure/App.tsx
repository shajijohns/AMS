import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AssociationRequestPage } from './pages/AssociationRequestPage';
import { CommitteeQueuePage } from './pages/CommitteeQueuePage';
import { OnboardingStepperPage } from './pages/OnboardingStepperPage';
import { MemberRosterPage } from './pages/MemberRosterPage';
import { MemberWizardPage } from './pages/MemberWizardPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { MemberLedgerPage } from './pages/MemberLedgerPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRequestsPage } from './pages/AdminRequestsPage';
import { AdminAssociationsPage } from './pages/AdminAssociationsPage';
import { AdminConfigurationPage } from './pages/AdminConfigurationPage';
import { AdminTenantsListPage } from './pages/AdminTenantsListPage';
import { AdminApproveTenantsPage } from './pages/AdminApproveTenantsPage';
import { AdminAddTenantPage } from './pages/AdminAddTenantPage';
import { AdminInviteTenantPage } from './pages/AdminInviteTenantPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminLayout } from './components/AdminLayout';
import { AdminMapPage } from './pages/AdminMapPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<AssociationRequestPage />} />
        <Route path="/committee" element={<CommitteeQueuePage />} />
        <Route path="/onboarding/:token" element={<OnboardingStepperPage />} />
        <Route path="/roster" element={<MemberRosterPage />} />
        <Route path="/invite/:token" element={<MemberWizardPage />} />
        <Route path="/profile" element={<MemberProfilePage />} />
        <Route path="/ledger" element={<MemberLedgerPage />} />
        <Route path="/checkout/:invoiceId" element={<CheckoutPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="associations" element={<AdminAssociationsPage />} />
          <Route path="configuration" element={<AdminConfigurationPage />} />
          <Route path="tenants/list" element={<AdminTenantsListPage />} />
          <Route path="tenants/approve" element={<AdminApproveTenantsPage />} />
          <Route path="tenants/add" element={<AdminAddTenantPage />} />
          <Route path="tenants/invite" element={<AdminInviteTenantPage />} />
          <Route path="map" element={<AdminMapPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
