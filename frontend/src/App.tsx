import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import DashboardHomePage from './pages/DashboardHomePage';
import TicketsPage from './pages/TicketsPage';
import AssignedTicketsPage from './pages/AssignedTicketsPage';
import DepartmentTicketsPage from './pages/DepartmentTicketsPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import FieldTypesPage from './pages/FieldTypesPage';
import SLAConfigurationsPage from './pages/SLAConfigurationsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import FormBuilderPage from './pages/FormBuilderPage';
import FormsManagementPage from './pages/FormsManagementPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import ProtectedRoute from './components/ProtectedRoute';
import DepartmentRoute from './components/Departments/DepartmentRoute';
import Layout from './components/Layout';
import ThemeProvider from './components/ThemeProvider';
import Toaster from './components/Toaster';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { useAuth } from './hooks/useAuth';
import { usePermissions } from './hooks/usePermissions';

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
        
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UnreadMessagesProvider>
    </ThemeProvider>
  );
}

export default App;
