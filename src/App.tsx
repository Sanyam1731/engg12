import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explorer from './pages/Explorer';
import Predictor from './pages/Predictor';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';
import Compare from './pages/Compare';
import Dashboard from './pages/Dashboard';
import { useApp } from './context';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/predictor" element={<Predictor />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
