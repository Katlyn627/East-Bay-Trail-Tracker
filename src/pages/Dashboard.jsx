import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Award as AwardIcon,
  Clock3,
  Footprints,
  Leaf,
  Loader,
  MapPinned,
  PanelRight,
  Trash2,
  X,
  Trees,
  Star,
  Zap
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
      <div className="flex min-h-screen items-center justify-center bg-sage-mist nature-pattern">
        <Loader size={32} className="animate-spin text-forest" />
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
      type: 'poppy',
      onClick: () => setIsIssueModalOpen(true),
    },
    {
      title: 'Log Cleanup',
      description: 'Record trash pickup and trail maintenance.',
      icon: Trash2,
      type: 'nature',
      onClick: () => setIsCleanupModalOpen(true),
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero Impact Section */}
      <section className="relative overflow-hidden ebtt-card bg-forest-evergreen p-6 mb-8 text-white shadow-xl !border-none">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sage-mist border border-white/20 text-xs font-bold mb-4">
            <Trees size={14} />
            CONSERVATION DASHBOARD
          </div>
          <h2 className="text-3xl font-heading font-black mb-2 text-white">Welcome Back, Ranger</h2>
          <p className="text-sage-mist/80 max-w-2xl text-sm leading-relaxed">
            Your contributions keep the East Bay trails safe and beautiful. Track your personal impact and community rewards below.
          </p>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Trees size={200} />
        </div>
      </section>

      {actionSuccessMessage && (
        <div className="mb-6 rounded-2xl border-2 border-forest-moss/30 bg-white/90 p-4 text-forest-deep font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="bg-forest/20 p-2 rounded-full"><Leaf size={20} className="text-forest" /></div>
          {actionSuccessMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Metrics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="ebtt-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-forest-evergreen/10 border border-forest-evergreen/20">
                <MapPinned size={24} className="text-forest-evergreen" />
              </div>
              <h3 className="text-2xl font-heading">Impact Metrics</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-forest-evergreen/5 border border-forest-moss/20 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Trash2 size={20} className="text-forest-evergreen shrink-0" />
                  <span className="text-[10px] font-bold text-forest-moss uppercase tracking-tighter truncate">Bags Logged</span>
                </div>
                <div className="text-3xl font-black text-forest-deep truncate">{impactMetrics.totalBags}</div>
                <div className="text-xs text-forest-moss font-medium mt-1 truncate">~{impactMetrics.totalWeightLbs.toFixed(1)} lbs removed</div>
              </div>

              <div className="p-5 rounded-2xl bg-lupine-purple/5 border border-lupine-purple/20 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Footprints size={20} className="text-lupine-purple shrink-0" />
                  <span className="text-[10px] font-bold text-lupine-purple uppercase tracking-tighter truncate">Miles Covered</span>
                </div>
                <div className="text-3xl font-black text-forest-deep truncate">{impactMetrics.totalMiles.toFixed(1)}</div>
                <div className="text-xs text-lupine-purple font-medium mt-1 truncate">Across {impactMetrics.uniqueTrailsCount} trails</div>
              </div>

              <div className="p-5 rounded-2xl bg-poppy-orange/5 border border-poppy-orange/20 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Clock3 size={20} className="text-poppy-orange shrink-0" />
                  <span className="text-[10px] font-bold text-poppy-orange uppercase tracking-tighter truncate">Hours Gifted</span>
                </div>
                <div className="text-3xl font-black text-forest-deep truncate">{impactMetrics.totalHours.toFixed(1)}</div>
                <div className="text-xs text-poppy-orange font-medium mt-1 truncate">Volunteer service</div>
              </div>

              <div className="p-5 rounded-2xl bg-earth-clay/5 border border-earth-clay/20 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Zap size={20} className="text-earth-clay shrink-0" />
                  <span className="text-[10px] font-bold text-earth-clay uppercase tracking-tighter truncate">Current Level</span>
                </div>
                <div className="text-3xl font-black text-forest-deep truncate">Level {Math.floor(impactMetrics.pointsBalance / 500) + 1}</div>
                <div className="text-xs text-earth-clay font-medium mt-1 truncate">Keep climbing!</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ebtt-card">
            <h3 className="text-xl font-heading mb-6 flex items-center gap-2">
              <Zap size={20} className="text-poppy-orange" />
              Quick Actions
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title.replace(/\s+/g, '-').toLowerCase()}
                  onClick={action.onClick}
                  className={`group p-6 rounded-2xl border-2 transition-all text-left flex flex-col items-start gap-4 ${
                    action.type === 'poppy'
                    ? 'bg-poppy-orange/5 border-poppy-orange/20 hover:bg-poppy-orange/10 hover:border-poppy-orange/40'
                    : 'bg-forest-evergreen/5 border-forest-evergreen/20 hover:bg-forest-evergreen/10 hover:border-forest-evergreen/40'
                  }`}
                >
                  <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${
                    action.type === 'poppy' ? 'bg-poppy-orange text-white' : 'bg-forest-evergreen text-white'
                  }`}>
                    <action.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-forest-deep">{action.title}</h4>
                    <p className="text-sm text-forest-deep/60 mt-1">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Points */}
        <div className="lg:col-span-4 space-y-6">
           <div className="ebtt-card bg-forest-evergreen text-white shadow-xl relative overflow-hidden !border-none p-6 sm:p-8">
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4 opacity-80">
                 <Star size={16} className="text-california-gold" />
                 <span className="text-xs font-bold uppercase tracking-[0.2em]">Rewards Points</span>
               </div>
               <div className="text-5xl font-black mb-2">{impactMetrics.pointsBalance}</div>
               <p className="text-sage-mist/60 text-sm mb-6 font-medium">Available to redeem for trail gear & perks</p>
               <button
                 onClick={() => setIsPointsDrawerOpen(true)}
                 className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
               >
                 View Rewards Hub <PanelRight size={18} />
               </button>
             </div>
             <div className="absolute bottom-[-20%] right-[-10%] opacity-20 pointer-events-none text-white">
                <Leaf size={120} />
             </div>
           </div>

           <div className="ebtt-card border-dashed border-2 border-forest-moss/30 p-6">
             <h4 className="font-heading font-bold text-forest-deep mb-4 uppercase text-[10px] tracking-[0.2em]">Next Badge</h4>
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-poppy-orange/10 flex items-center justify-center border-2 border-dashed border-poppy-orange/30">
                 <AwardIcon size={32} className="text-poppy-orange opacity-40" />
               </div>
               <div>
                 <p className="font-bold text-forest-deep">Redwood Guardian</p>
                 <p className="text-xs text-forest-moss font-medium">Log 5 more cleanups</p>
               </div>
             </div>
             <div className="mt-5 w-full bg-forest-moss/10 h-2.5 rounded-full overflow-hidden">
                <div className="bg-poppy-orange h-full transition-all duration-1000 ease-out w-[60%]"></div>
             </div>
           </div>
        </div>
      </div>

      {/* Rewards Drawer */}
      <div
        className={`fixed inset-0 z-[60] bg-forest-deep/40 backdrop-blur-sm transition-opacity duration-300 ${
          isPointsDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsPointsDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md transform flex flex-col bg-sage-mist shadow-2xl transition-transform duration-500 ease-out ${
          isPointsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="shrink-0 flex items-center justify-between bg-white border-b border-forest-evergreen/10 px-6 py-6">
          <div>
            <h3 className="text-2xl font-heading font-black text-forest-deep">Rewards Hub</h3>
            <p className="text-xs font-bold text-poppy-orange uppercase tracking-widest mt-1">Redeem your impact</p>
          </div>
          <button
            onClick={() => setIsPointsDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-forest-evergreen/5 text-forest-evergreen transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="ebtt-card bg-forest-evergreen text-white !border-none">
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Current Balance</p>
            <p className="text-4xl font-black">{impactMetrics.pointsBalance} <span className="text-xl text-california-gold">PTS</span></p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-moss mb-4">Milestone Perks</h4>
            <div className="space-y-4">
              {[
                { name: 'Poppy Sticker Pack', cost: '250 pts', desc: 'Custom trail stickers' },
                { name: 'Local Hero Badge', cost: '500 pts', desc: 'Featured on community board' },
                { name: 'Ranger Kit', cost: '1200 pts', desc: 'High-vis cleanup gear' },
              ].map((perk, idx) => (
                <div key={`${perk.name}-${idx}`} className="group rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-forest-evergreen/30 hover:shadow-md cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-forest-deep group-hover:text-forest-evergreen transition-colors">{perk.name}</p>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-poppy-orange/10 text-poppy-orange rounded-lg uppercase tracking-tight">{perk.cost}</span>
                  </div>
                  <p className="text-xs text-forest-moss/80 font-medium">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
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
