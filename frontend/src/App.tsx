import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ThemeProvider from './components/ThemeProvider';
import Toaster from './components/Toaster';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { useAuth } from './hooks/useAuth';
import { usePermissions } from './hooks/usePermissions';

// Lazy-loaded pages (code splitting por ruta)
const DashboardHomePage = lazy(() => import('./pages/DashboardHomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const AssignedTicketsPage = lazy(() => import('./pages/AssignedTicketsPage'));
const DepartmentTicketsPage = lazy(() => import('./pages/DepartmentTicketsPage'));
const CreateTicketPage = lazy(() => import('./pages/CreateTicketPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const FieldTypesPage = lazy(() => import('./pages/FieldTypesPage'));
const SLAConfigurationsPage = lazy(() => import('./pages/SLAConfigurationsPage'));
const EmailTemplatesPage = lazy(() => import('./pages/EmailTemplatesPage'));
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage'));
const FormsManagementPage = lazy(() => import('./pages/FormsManagementPage'));
const KanbanBoardPage = lazy(() => import('./pages/KanbanBoardPage'));
const DepartmentRoute = lazy(() => import('./components/Departments/DepartmentRoute'));
const BrandingPage = lazy(() => import('./pages/BrandingPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuth();
  const { loadPermissions } = usePermissions();
  const hasInitialized = useRef(false);
  const hasLoadedPermissions = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadUser();
    }
  }, [loadUser]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasLoadedPermissions.current) {
      hasLoadedPermissions.current = true;
      loadPermissions();
    }
    
    // Reset flag cuando el usuario cierra sesión
    if (!isAuthenticated) {
      hasLoadedPermissions.current = false;
    }
  }, [isAuthenticated, isLoading, loadPermissions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <UnreadMessagesProvider>
        <Router>
          <Toaster />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardHomePage />
                </Layout>
              </ProtectedRoute>
            }
          />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateTicketPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/assigned"
          element={
            <ProtectedRoute>
              <Layout>
                <AssignedTicketsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/department"
          element={
            <ProtectedRoute>
              <Layout>
                <DepartmentTicketsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/kanban"
          element={
            <ProtectedRoute>
              <Layout>
                <KanbanBoardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <Layout>
                <DepartmentRoute />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/field-types"
          element={
            <ProtectedRoute>
              <Layout>
                <FieldTypesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sla-configurations"
          element={
            <ProtectedRoute>
              <Layout>
                <SLAConfigurationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/email-templates"
          element={
            <ProtectedRoute>
              <Layout>
                <EmailTemplatesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms"
          element={
            <ProtectedRoute>
              <Layout>
                <FormsManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/forms/:formId"
          element={
            <ProtectedRoute>
              <Layout>
                <FormBuilderPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branding"
          element={
            <ProtectedRoute>
              <Layout>
                <BrandingPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </UnreadMessagesProvider>
    </ThemeProvider>
  );
}

export default App;
