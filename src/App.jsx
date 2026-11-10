import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import Dashboard from './pages/Dashboard';
import LogCleanup from './pages/LogCleanup';
import ReportIncident from './pages/ReportIncident';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
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

            {/* Protected app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/log-cleanup" element={<LogCleanup />} />
              <Route path="/report-incident" element={<ReportIncident />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/report" element={<Navigate to="/report-incident" replace />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
