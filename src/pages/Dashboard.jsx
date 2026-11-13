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
    <div className="min-h-screen bg-transparent pb-12">
      {/* Hero Impact Section */}
      <section className="relative overflow-hidden organic-card bg-forest-gradient p-6 mb-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sage-mist border border-white/20 text-xs font-bold mb-4">
            <Trees size={14} />
            CONSERVATION DASHBOARD
          </div>
          <h2 className="text-3xl font-heading font-black mb-2">Welcome Back, Ranger</h2>
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Metrics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="organic-card p-6 bg-white/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-forest/10 border border-forest/20">
                <MapPinned size={24} className="text-forest" />
              </div>
              <h3 className="text-2xl font-heading">Impact Metrics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-[2rem] rounded-tr-lg rounded-bl-lg bg-forest/5 border border-forest-moss/20">
                <div className="flex items-center justify-between mb-2">
                  <Trash2 size={20} className="text-forest" />
                  <span className="text-[10px] font-bold text-forest-moss uppercase tracking-tighter">Bags Logged</span>
                </div>
                <div className="text-3xl font-black text-forest-deep">{impactMetrics.totalBags}</div>
                <div className="text-xs text-forest-moss font-medium mt-1">~{impactMetrics.totalWeightLbs.toFixed(1)} lbs removed</div>
              </div>

              <div className="p-5 rounded-[2rem] rounded-tl-lg rounded-br-lg bg-lupine/5 border border-lupine/20">
                <div className="flex items-center justify-between mb-2">
                  <Footprints size={20} className="text-lupine" />
                  <span className="text-[10px] font-bold text-lupine uppercase tracking-tighter">Miles Covered</span>
                </div>
                <div className="text-3xl font-black text-forest-deep">{impactMetrics.totalMiles.toFixed(1)}</div>
                <div className="text-xs text-lupine font-medium mt-1">Across {impactMetrics.uniqueTrailsCount} trails</div>
              </div>

              <div className="p-5 rounded-[2rem] rounded-tl-lg rounded-br-lg bg-poppy/5 border border-poppy/20">
                <div className="flex items-center justify-between mb-2">
                  <Clock3 size={20} className="text-poppy" />
                  <span className="text-[10px] font-bold text-poppy uppercase tracking-tighter">Hours Gifted</span>
                </div>
                <div className="text-3xl font-black text-forest-deep">{impactMetrics.totalHours.toFixed(1)}</div>
                <div className="text-xs text-poppy font-medium mt-1">Volunteer service</div>
              </div>

              <div className="p-5 rounded-[2rem] rounded-tr-lg rounded-bl-lg bg-earth/5 border border-earth-clay/20">
                <div className="flex items-center justify-between mb-2">
                  <Zap size={20} className="text-earth" />
                  <span className="text-[10px] font-bold text-earth-clay uppercase tracking-tighter">Current Level</span>
                </div>
                <div className="text-3xl font-black text-forest-deep">Level {Math.floor(impactMetrics.pointsBalance / 500) + 1}</div>
                <div className="text-xs text-earth-clay font-medium mt-1">Keep climbing!</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="organic-card p-6 bg-white/80">
            <h3 className="text-xl font-heading mb-6 flex items-center gap-2">
              <Zap size={20} className="text-poppy" />
              Quick Actions
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className={`group p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col items-start gap-4 ${
                    action.type === 'poppy'
                    ? 'bg-poppy/5 border-poppy/20 hover:bg-poppy/10 hover:border-poppy/40'
                    : 'bg-forest/5 border-forest/20 hover:bg-forest/10 hover:border-forest/40'
                  }`}
                >
                  <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${
                    action.type === 'poppy' ? 'bg-poppy text-white' : 'bg-forest text-white'
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
        <div className="space-y-8">
           <div className="organic-card p-6 bg-forest-gradient text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4 opacity-80">
                 <Star size={16} className="text-gold" />
                 <span className="text-xs font-bold uppercase tracking-widest">Rewards Points</span>
               </div>
               <div className="text-5xl font-black mb-2">{impactMetrics.pointsBalance}</div>
               <p className="text-sage-mist/60 text-sm mb-6 font-medium">Available to redeem for trail gear & perks</p>
               <button
                 onClick={() => setIsPointsDrawerOpen(true)}
                 className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
               >
                 View Rewards Hub <PanelRight size={18} />
               </button>
             </div>
             <div className="absolute bottom-[-20%] right-[-10%] opacity-20 pointer-events-none">
                <Leaf size={120} />
             </div>
           </div>

           <div className="organic-card p-6 bg-white/80 border-dashed border-2 border-forest-moss/30">
             <h4 className="font-heading font-bold text-forest-deep mb-4 uppercase text-xs tracking-widest">Next Badge</h4>
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-poppy/10 flex items-center justify-center border-2 border-dashed border-poppy/30">
                 <Award size={32} className="text-poppy opacity-40" />
               </div>
               <div>
                 <p className="font-bold text-forest-deep">Redwood Guardian</p>
                 <p className="text-xs text-forest-moss">Log 5 more cleanups</p>
               </div>
             </div>
             <div className="mt-4 w-full bg-forest-moss/10 h-2 rounded-full overflow-hidden">
                <div className="bg-poppy h-full transition-all w-[60%]"></div>
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
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md transform overflow-y-auto bg-sage-mist shadow-2xl transition-transform duration-500 ease-out ${
          isPointsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-forest/10 px-6 py-6">
          <div>
            <h3 className="text-2xl font-heading font-black text-forest-deep">Rewards Hub</h3>
            <p className="text-xs font-bold text-poppy uppercase tracking-widest mt-1">Redeem your impact</p>
          </div>
          <button
            onClick={() => setIsPointsDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-forest/5 text-forest transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="organic-card p-6 bg-forest-gradient text-white">
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Current Balance</p>
            <p className="text-4xl font-black">{impactMetrics.pointsBalance} <span className="text-xl text-gold">PTS</span></p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-forest-moss mb-4">Milestone Perks</h4>
            <div className="space-y-3">
              {[
                { name: 'Poppy Sticker Pack', cost: '250 pts', desc: 'Custom trail stickers' },
                { name: 'Local Hero Badge', cost: '500 pts', desc: 'Featured on community board' },
                { name: 'Ranger Kit', cost: '1200 pts', desc: 'High-vis cleanup gear' },
              ].map((perk) => (
                <div key={perk.name} className="organic-card p-4 bg-white hover:border-forest/30 cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-forest-deep">{perk.name}</p>
                    <span className="text-xs font-black px-2 py-1 bg-poppy/10 text-poppy rounded-lg">{perk.cost}</span>
                  </div>
                  <p className="text-xs text-forest-moss">{perk.desc}</p>
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
