import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Award,
  Clock3,
  Edit2,
  Footprints,
  Loader,
  MapPinned,
  Mountain,
  Trash2,
} from 'lucide-react';
import ReportCleanupModal from '../components/ReportCleanupModal';
import ReportIssueModal from '../components/ReportIssueModal';

const Dashboard = () => {
  const { user, userProfile, loading, updateUserProfile } = useAuth();
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader size={32} className="animate-spin text-emerald-700" />
      </div>
    );
  }

  const impactMetrics = {
    totalBags: userProfile?.totalBags ?? userProfile?.trashBagsCollected ?? 0,
    totalWeightLbs: userProfile?.totalWeightLbs || 0,
    totalMiles: userProfile?.totalMiles ?? userProfile?.milesLogged ?? 0,
    totalHours: userProfile?.totalHours ?? userProfile?.volunteerHours ?? 0,
    uniqueTrailsCount: Array.isArray(userProfile?.uniqueTrails)
      ? userProfile.uniqueTrails.length
      : 0,
    pointsBalance: userProfile?.pointsBalance || 0,
  };

  const stats = [
    {
      label: 'Trash Bags',
      value: impactMetrics.totalBags,
      detail: `${impactMetrics.totalWeightLbs.toFixed(1)} lbs removed`,
      icon: <Trash2 size={21} className="text-[#1B4332]" />,
      tone: 'from-[#52B788]/20 to-[#52B788]/5',
    },
    {
      label: 'Miles',
      value: impactMetrics.totalMiles.toFixed(1),
      detail: 'Distance cleaned',
      icon: <MapPinned size={21} className="text-[#1B4332]" />,
      tone: 'from-[#1B4332]/10 to-[#1B4332]/5',
    },
    {
      label: 'Hours',
      value: impactMetrics.totalHours.toFixed(1),
      detail: 'Volunteer time',
      icon: <Clock3 size={21} className="text-[#1B4332]" />,
      tone: 'from-[#D4A373]/25 to-[#D4A373]/10',
    },
    {
      label: 'Unique Trails',
      value: impactMetrics.uniqueTrailsCount,
      detail: 'Distinct trail routes',
      icon: <Footprints size={21} className="text-[#1B4332]" />,
      tone: 'from-[#52B788]/15 to-[#D4A373]/10',
    },
    {
      label: 'Points',
      value: impactMetrics.pointsBalance,
      detail: 'Impact rewards earned',
      icon: <Award size={21} className="text-[#1B4332]" />,
      tone: 'from-[#D4A373]/25 to-[#52B788]/10',
    },
  ];

  const quickActions = [
    {
      title: 'Report Trail Hazard',
      description: 'Flag downed trees, erosion, or overgrowth.',
      icon: AlertCircle,
      tone: 'amber',
      onClick: () => setIsIssueModalOpen(true),
    },
    {
      title: 'Log Cleanup',
      description: 'Record trash pickup and trail maintenance work.',
      icon: Trash2,
      tone: 'emerald',
      onClick: () => setIsCleanupModalOpen(true),
    },
  ];

  const rewards = [
    { label: 'Trail cleanup', value: '+25 pts', detail: 'Litter pickup and site restoration' },
    { label: 'Maintenance report', value: '+50 pts', detail: 'Hazard and infrastructure reporting' },
  ];

  return (
    <div className="page-container min-h-screen bg-transparent">
      <div className="mb-6 rounded-2xl border border-[#D4A373]/30 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">Dashboard</p>
        <h2 className="mt-2 text-2xl font-bold text-[#1B4332] sm:text-3xl">Trail Impact Snapshot</h2>
      </div>

      <div className="mx-auto max-w-6xl px-0 sm:px-2">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-[#D4A373]/20 bg-gradient-to-br ${stat.tone} p-4 shadow-sm`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B4332]/80">
                  {stat.label}
                </span>
                <div className="rounded-lg border border-[#D4A373]/35 bg-white/85 p-2">{stat.icon}</div>
              </div>
              <p className="text-3xl font-bold text-[#1B4332]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#1B4332]/70">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="card mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#f5f8ef] to-white p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field w-full"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary h-11 px-4">
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
                className="flex h-11 items-center gap-2 rounded-xl border border-[#2D5A27]/20 bg-[#edf7ec] px-3 text-[#1B4332] transition-colors hover:bg-[#e4f4e3]"
              >
                <Edit2 size={18} />
                <span className="text-sm font-medium">Edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={22} className="text-amber-600" />
              <h3 className="text-xl font-bold text-dark">Incident & Maintenance Reporting</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map(({ title, description, icon: Icon, onClick, tone }) => (
                <button
                  key={title}
                  type="button"
                  onClick={onClick}
                  className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                    tone === 'amber'
                      ? 'border-amber-200 bg-amber-50/70'
                      : 'border-emerald-200 bg-emerald-50/70'
                  }`}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon size={22} className={tone === 'amber' ? 'text-amber-700' : 'text-emerald-700'} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">{title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <Award size={22} className="text-orange-500" />
              <h3 className="text-xl font-bold text-dark">Points Balance & Rewards Ledger</h3>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current balance</p>
              <p className="mt-2 text-4xl font-bold">{impactMetrics.pointsBalance}</p>
              <p className="mt-2 text-sm text-emerald-100">Trail maintenance and cleanup points update instantly.</p>
            </div>

            <div className="mt-4 space-y-3">
              {rewards.map((reward) => (
                <div key={reward.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{reward.label}</p>
                    <p className="text-xs text-slate-500">{reward.detail}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{reward.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Mountain size={22} className="text-emerald-700" />
            <h3 className="text-xl font-bold text-dark">Trash & Cleanup Metrics</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Total trash bags</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{impactMetrics.totalBags}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm text-sky-700">Miles logged</p>
              <p className="mt-2 text-3xl font-bold text-sky-900">{impactMetrics.totalMiles.toFixed(1)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Volunteer hours</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{impactMetrics.totalHours.toFixed(1)}</p>
            </div>
            <div className="rounded-2xl border border-[#D4A373]/30 bg-[#fff8f2] p-4">
              <p className="text-sm text-[#8b6a4f]">Estimated weight removed</p>
              <p className="mt-2 text-3xl font-bold text-[#5c4433]">{impactMetrics.totalWeightLbs.toFixed(1)} lbs</p>
            </div>
          </div>
        </div>
      </div>

      <ReportIssueModal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} />
      <ReportCleanupModal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
