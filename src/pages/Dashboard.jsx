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
  PanelRight,
  Trash2,
  X,
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
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [isPointsDrawerOpen, setIsPointsDrawerOpen] = useState(false);

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

  const handleActionSuccess = (message) => {
    setActionSuccessMessage(message);
    window.setTimeout(() => {
      setActionSuccessMessage('');
    }, 2800);
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

  const pointsBreakdown = [
    { label: 'Trail cleanup log', value: '+25 pts', detail: 'Base reward per cleanup entry' },
    { label: 'Trail hazard report', value: '+50 pts', detail: 'Maintenance priority reporting' },
  ];

  const upcomingBadges = [
    { name: 'Neighborhood Steward', requirement: 'Reach 500 total points' },
    { name: 'Trail Guardian', requirement: 'Log 25 cleanup submissions' },
    { name: 'Impact Pathfinder', requirement: 'Clean 10 unique trails' },
  ];

  const upcomingPerks = [
    { name: 'Bronze Perk Pack', cost: '300 pts', description: 'Community shout-out + profile badge flair' },
    { name: 'Silver Volunteer Kit', cost: '700 pts', description: 'Priority leaderboard highlight for one cycle' },
    { name: 'Gold Steward Status', cost: '1200 pts', description: 'Featured contributor spotlight' },
  ];

  return (
    <div className="page-container min-h-screen bg-transparent">
      <div className="mb-6 rounded-2xl border border-[#D4A373]/30 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">Dashboard</p>
        <h2 className="mt-2 text-2xl font-bold text-[#1B4332] sm:text-3xl">Trail Impact Snapshot</h2>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 rounded-xl border border-[#52B788]/40 bg-[#ecf9f1] px-4 py-3 text-sm font-medium text-[#1B4332]">
          {actionSuccessMessage}
        </div>
      )}

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

        <div className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned size={22} className="text-[#1B4332]" />
              <h3 className="text-xl font-bold text-dark">Impact Metrics</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] px-3 py-2">
                <p className="text-sm font-semibold text-[#1B4332]">Total trash bags</p>
                <span className="text-base font-bold text-[#1B4332]">{impactMetrics.totalBags}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] px-3 py-2">
                <p className="text-sm font-semibold text-[#1B4332]">Miles cleaned</p>
                <span className="text-base font-bold text-[#1B4332]">{impactMetrics.totalMiles.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] px-3 py-2">
                <p className="text-sm font-semibold text-[#1B4332]">Volunteer hours</p>
                <span className="text-base font-bold text-[#1B4332]">{impactMetrics.totalHours.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] px-3 py-2">
                <p className="text-sm font-semibold text-[#1B4332]">Unique trails</p>
                <span className="text-base font-bold text-[#1B4332]">{impactMetrics.uniqueTrailsCount}</span>
              </div>
            </div>
          </div>

          <div className="card border-[#52B788]/35 bg-gradient-to-br from-[#eef9f2] to-white">
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
        </div>

      </div>

      <button
        type="button"
        onClick={() => setIsPointsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#22523f]"
      >
        <PanelRight size={16} />
        Points: {impactMetrics.pointsBalance}
      </button>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity ${
          isPointsDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsPointsDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-y-auto border-l border-[#D4A373]/35 bg-white shadow-2xl transition-transform duration-300 ${
          isPointsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D4A373]/25 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">Points & Rewards</p>
            <h3 className="text-xl font-bold text-[#1B4332]">Rewards Ledger</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsPointsDrawerOpen(false)}
            className="rounded-full p-2 text-[#1B4332] transition hover:bg-[#edf7ec]"
            aria-label="Close points drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#22523f] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">Current balance</p>
            <p className="mt-2 text-4xl font-bold">{impactMetrics.pointsBalance}</p>
            <p className="mt-2 text-sm text-white/85">Use points to plan your next community rewards milestone.</p>
          </div>

          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1B4332]">Point Breakdown</h4>
            <div className="space-y-2">
              {pointsBreakdown.map((entry) => (
                <div key={entry.label} className="rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1B4332]">{entry.label}</p>
                    <span className="text-sm font-bold text-[#1B4332]">{entry.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#1B4332]/70">{entry.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1B4332]">Badges to Unlock</h4>
            <div className="space-y-2">
              {upcomingBadges.map((badge) => (
                <div key={badge.name} className="rounded-xl border border-[#52B788]/35 bg-[#eef9f2] px-3 py-2">
                  <p className="text-sm font-semibold text-[#1B4332]">{badge.name}</p>
                  <p className="text-xs text-[#1B4332]/70">{badge.requirement}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1B4332]">Upcoming Perks</h4>
            <div className="space-y-2">
              {upcomingPerks.map((perk) => (
                <div key={perk.name} className="rounded-xl border border-[#D4A373]/30 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1B4332]">{perk.name}</p>
                    <span className="text-xs font-bold text-[#8b6a4f]">{perk.cost}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#1B4332]/70">{perk.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <ReportIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <ReportCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

export default Dashboard;
