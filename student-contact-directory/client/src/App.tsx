import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { Spinner } from './components/common/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDirectory from './pages/StudentDirectory';
import AddStudent from './pages/AddStudent';
import StudentDetails from './pages/StudentDetails';
import ImportStudents from './pages/ImportStudents';
import Settings from './pages/Settings';

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={loading ? <Spinner /> : user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentDirectory />} />
        <Route path="/students/new" element={<Protected admin><AddStudent /></Protected>} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/students/:id/edit" element={<Protected admin><AddStudent /></Protected>} />
        <Route path="/import" element={<Protected admin><ImportStudents /></Protected>} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
