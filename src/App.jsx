import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import Dashboard from './pages/Dashboard';
import TrailReportForm from './components/TrailReportForm';
import ReportCleanup from './components/ReportCleanup';
import StravaAuthCallback from './components/StravaAuthCallback';
import './styles/index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/strava-callback" element={<StravaAuthCallback />} />
          <Route path="/auth/strava/callback" element={<StravaAuthCallback />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <TrailReportForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cleanup"
            element={
              <ProtectedRoute>
                <ReportCleanup />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
