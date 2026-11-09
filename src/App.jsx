import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import Dashboard from './pages/Dashboard';
import TrailReportForm from './components/TrailReportForm';
import StravaAuthCallback from './components/StravaAuthCallback';
import './styles/index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen w-full max-w-[1280px] mx-auto overflow-x-hidden bg-[#f4f6f0] px-0 sm:px-3">
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
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
