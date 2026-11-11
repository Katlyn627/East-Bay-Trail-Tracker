import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Clock3,
  Footprints,
  Leaf,
  Loader,
  MapPinned,
  PanelRight,
  Trash2,
  X,
} from 'lucide-react';
import ReportCleanupModal from '../components/ReportCleanupModal';
import ReportIssueModal from '../components/ReportIssueModal';

const Dashboard = () => {
  const { userProfile, loading } = useAuth();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [isPointsDrawerOpen, setIsPointsDrawerOpen] = useState(false);

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
      <section className="brand-hero-banner mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">Stewardship dashboard</p>
        <h2 className="mt-1 text-3xl font-black text-white">East Bay Trail Tracker Impact Hub</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/90">
          Track cleanup outcomes, coordinate trail actions, and monitor milestone rewards in one branded command center.
        </p>
      </section>

      {actionSuccessMessage && (
        <div className="mb-6 rounded-xl border border-[#52B788]/40 bg-[#ecf9f1] px-4 py-3 text-sm font-medium text-[#1B4332]">
          {actionSuccessMessage}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-0 sm:px-2">
        <div className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="card organic-card relative overflow-hidden border-[#D9EEDF] bg-[linear-gradient(160deg,#F4F9F4_0%,#EEF7F1_36%,#F9FBF9_100%)] p-5 shadow-[0_18px_38px_rgba(17,42,31,0.06)]">
            <div className="pointer-events-none absolute -right-8 -top-6 h-24 w-24 rounded-full bg-[#52B788]/10 blur-xl" />
            <div className="pointer-events-none absolute bottom-2 right-4 text-[#2D6A4F]/10">
              <Leaf size={52} />
            </div>
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-[#DDF4E7] shadow-sm">
                <MapPinned size={18} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-[#112A1F]">Impact Metrics</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-[1rem] rounded-bl-[1rem] border border-[#A7D7B8] bg-[linear-gradient(135deg,#ECF8F0_0%,#DFF3E8_48%,#F3FBF6_100%)] p-4 shadow-sm">
                <div className="absolute -right-2 -top-3 rotate-12 rounded-full bg-[#1B4332]/5 p-2 text-[#1B4332]/30">
                  <Leaf size={18} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-[#1B4332]">
                    <Trash2 size={16} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1B4332]">Total Trash</p>
                </div>
                <p className="text-3xl font-black leading-none text-[#1B4332]">{impactMetrics.totalBags}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-[#1B4332]/70">bags collected</p>
                <p className="mt-1 text-sm text-[#1B4332]/80">{impactMetrics.totalWeightLbs.toFixed(1)} lbs removed</p>
              </div>

              <div className="relative overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-[1rem] rounded-bl-[1rem] border border-[#B9DDE6] bg-[linear-gradient(135deg,#EAF9FB_0%,#DCF5F8_42%,#F5FCFF_100%)] p-4 shadow-sm">
                <div className="absolute -right-2 -top-3 rounded-full bg-[#2D6A4F]/5 p-2 text-[#234F64]/25">
                  <Leaf size={18} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F4C5C]/10 text-[#1E4D5F]">
                    <MapPinned size={16} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1E4D5F]">Miles Logged</p>
                </div>
                <p className="text-3xl font-black leading-none text-[#123A46]">{impactMetrics.totalMiles.toFixed(1)}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-[#1E4D5F]/75">trail distance</p>
                <p className="mt-1 text-sm text-[#1E4D5F]/80">Across woodland routes and creek loops</p>
              </div>

              <div className="relative overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-[1rem] rounded-bl-[1rem] border border-[#E2CDB1] bg-[linear-gradient(135deg,#FFF8EE_0%,#F8EEDB_42%,#FFFDF9_100%)] p-4 shadow-sm">
                <div className="absolute -right-2 -top-3 rounded-full bg-[#8B6A4F]/5 p-2 text-[#8B6A4F]/30">
                  <Leaf size={18} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B6A4F]/10 text-[#6f5038]">
                    <Clock3 size={16} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f5038]">Volunteer Hours</p>
                </div>
                <p className="text-3xl font-black leading-none text-[#5C4737]">{impactMetrics.totalHours.toFixed(1)}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-[#6f5038]/75">hours served</p>
                <p className="mt-1 text-sm text-[#6f5038]/80">Community maintenance time contributed</p>
              </div>

              <div className="relative overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-[1rem] rounded-bl-[1rem] border border-[#C8E0CE] bg-[linear-gradient(135deg,#F2FAF4_0%,#E6F3E7_48%,#F8FCF9_100%)] p-4 shadow-sm">
                <div className="absolute -right-2 -top-3 rounded-full bg-[#2D6A4F]/5 p-2 text-[#2D6A4F]/30">
                  <Leaf size={18} />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-[#1B4332]">
                    <Footprints size={16} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1B4332]">Unique Trails</p>
                </div>
                <p className="text-3xl font-black leading-none text-[#112A1F]">{impactMetrics.uniqueTrailsCount}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-[#1B4332]/75">parks visited</p>
                <p className="mt-1 text-sm text-[#1B4332]/80">Distinct routes restored and stewarded</p>
              </div>
            </div>
          </div>

          <div className="card organic-card relative overflow-hidden border-[#D3E7D8] bg-[linear-gradient(135deg,#F7FAF7_0%,#EEF7F0_38%,#FFFFFF_100%)] p-5 shadow-[0_18px_38px_rgba(17,42,31,0.06)]">
            <div className="absolute -left-8 top-5 h-20 w-20 rounded-full bg-[#52B788]/10 blur-2xl" />
            <div className="pointer-events-none absolute right-5 top-3 text-[#2D6A4F]/10">
              <Leaf size={38} />
            </div>
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A373]/15 text-[#8B6A4F] shadow-sm">
                <AlertCircle size={18} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-[#112A1F]">Incident & Maintenance Reporting</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map(({ title, description, icon: Icon, onClick, tone }) => (
                <button
                  key={title}
                  type="button"
                  onClick={onClick}
                  className={`group relative overflow-hidden rounded-tl-[2.2rem] rounded-br-[2.2rem] rounded-tr-[1rem] rounded-bl-[1rem] border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    tone === 'amber'
                      ? 'border-[#E6D0A3] bg-[linear-gradient(135deg,#FFF9F1_0%,#F9F0E1_100%)]'
                      : 'border-[#CFE7D6] bg-[linear-gradient(135deg,#F5FBF7_0%,#EAF8F0_100%)]'
                  }`}
                >
                  <div className="absolute right-3 top-3 text-[#2D6A4F]/10">
                    <Leaf size={24} />
                  </div>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-[#D2E7D8]">
                    <Icon size={22} className={tone === 'amber' ? 'text-[#8B6A4F]' : 'text-[#2D6A4F]'} />
                  </div>
                  <h4 className="text-base font-black text-[#112A1F]">{title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-[#1B4332]/75">{description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                    {tone === 'amber' ? 'Log issue' : 'Track cleanup'}
                  </div>
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
