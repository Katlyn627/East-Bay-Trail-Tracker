import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import ProfileSetupWizard from './ProfileSetupWizard';

const ProtectedRoute = ({ children }) => {
  const { user, loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {needsProfileSetup && <ProfileSetupWizard />}
      {children}
    </>
  );
};

export default ProtectedRoute;
