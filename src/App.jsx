import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const Allocate = lazy(() => import('./pages/Allocate'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Report = lazy(() => import('./pages/Report'));
const MyCases = lazy(() => import('./pages/MyCases'));
const FieldCase = lazy(() => import('./pages/FieldCase'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const Audit = lazy(() => import('./pages/Audit'));
const Profile = lazy(() => import('./pages/Profile'));
import { useAuthStore } from './store/authStore';
import { STAFF, ROLES, homeFor } from './config';
import { Loading } from './components/ui';

const Home = () => {
  const { user } = useAuthStore();
  return <Navigate to={homeFor(user?.role)} replace />;
};

const guard = (el, roles) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

function App() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden print:h-auto print:overflow-visible">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Printable report: full page, outside the app chrome. */}
          <Route path="/cases/:caseNo/report" element={guard(<Report />, STAFF)} />

          <Route path="/" element={guard(<Layout />, ROLES)}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={guard(<Dashboard />, STAFF)} />
            <Route path="cases" element={guard(<Cases />, STAFF)} />
            <Route path="cases/:caseNo" element={guard(<CaseDetail />, STAFF)} />
            <Route path="allocate" element={guard(<Allocate />, STAFF)} />
            <Route path="my-cases" element={guard(<MyCases />, ['FIELD_EXEC'])} />
            <Route path="field/:caseNo" element={guard(<FieldCase />, ['FIELD_EXEC'])} />
            <Route path="users" element={guard(<Users />, ['ADMIN'])} />
            <Route path="settings" element={guard(<Settings />, ['ADMIN'])} />
            <Route path="audit" element={guard(<Audit />, ['ADMIN'])} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
