import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, Loader, TreePine, Trash2, AlertCircle, Award } from 'lucide-react';
import StravaConnectionCard from '../components/StravaConnectionCard';
import VirtualForest from '../components/VirtualForest';
import ReportCleanupModal from '../components/ReportCleanupModal';
import ReportIssueModal from '../components/ReportIssueModal';

const Dashboard = () => {
  const { user, userProfile, loading, logOut, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      alert('Display name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Miles Logged',
      value: userProfile?.milesLogged || 0,
      icon: <TreePine size={24} className="text-primary" />,
    },
    {
      label: 'Trash Collected',
      value: userProfile?.trashBagsCollected || 0,
      icon: <Trash2 size={24} className="text-secondary" />,
    },
    {
      label: 'Issues Reported',
      value: userProfile?.issuesReported || 0,
      icon: <AlertCircle size={24} className="text-accent" />,
    },
    {
      label: 'Points Balance',
      value: userProfile?.pointsBalance || 0,
      icon: <Award size={24} className="text-orange-500" />,
    },
  ];

  const badges = userProfile?.badgesEarned || [];

  return (
    <div className="page-container min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <button
            onClick={handleLogOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="card mb-6 rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field w-full"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="btn-primary h-11 px-4"
                    >
                      {isSaving ? <Loader size={20} className="animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(userProfile?.displayName || '');
                      }}
                      className="btn-outline h-11 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-dark sm:text-3xl">
                    {userProfile?.displayName || 'Trail Adventurer'}
                  </h2>
                  <p className="text-sm text-gray-600 sm:text-base">{user?.email}</p>
                </div>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-11 items-center gap-2 rounded-lg px-3 text-primary transition-colors hover:bg-blue-50"
              >
                <Edit2 size={18} />
                <span className="text-sm font-medium">Edit</span>
              </button>
            )}
          </div>
        </div>

        <StravaConnectionCard />
        <VirtualForest />

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="card mobile-card text-center">
              <div className="mb-3 flex justify-center">{stat.icon}</div>
              <p className="mb-1 text-2xl font-bold text-dark sm:text-3xl">{stat.value}</p>
              <p className="text-xs text-gray-600 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="card mobile-card cursor-pointer transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={28} className="text-accent" />
              <div className="text-left">
                <h3 className="text-base font-bold text-dark sm:text-lg">Report Issue</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Flag maintenance problems</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsCleanupModalOpen(true)}
            className="card mobile-card cursor-pointer transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={28} className="text-secondary" />
              <div className="text-left">
                <h3 className="text-base font-bold text-dark sm:text-lg">Log Cleanup</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Record your trail work</p>
              </div>
            </div>
          </button>
        </div>

        {/* Badges Section */}
        <div className="card">
          <h3 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
            <Award size={24} className="text-orange-500" />
            Achievements
          </h3>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className="badge flex flex-col items-center justify-center p-4"
                >
                  <span className="text-2xl mb-2">🏆</span>
                  <p className="text-sm font-medium text-center">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              Start reporting issues and logging cleanups to unlock badges!
            </p>
          )}
        </div>
      </div>

      <ReportIssueModal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} />
      <ReportCleanupModal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
