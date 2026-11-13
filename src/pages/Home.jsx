import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Award, MapPin, Trees, ChevronRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sage-mist nature-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-forest/90 backdrop-blur-md border-b border-forest-light/20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-inner flex items-center justify-center overflow-hidden">
               <img src="/ebtt-app-icon.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-poppy-light">EAST BAY TRAILS</p>
              <h1 className="text-xl font-heading text-white leading-none">Trail Tracker</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 font-semibold text-white/90 hover:text-white transition-colors text-sm"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="btn-poppy text-sm px-5"
            >
              Join the Pack
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 pt-12 pb-24">
        <div className="relative overflow-hidden organic-card bg-forest-gradient p-8 md:p-16 mb-16 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-poppy/20 text-poppy-light border border-poppy/30 text-xs font-bold mb-6">
              <Trees size={14} />
              CONSERVING CALIFORNIA TRAILS
            </div>
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight">
              Protect the Trails <br />
              <span className="text-gold">You Love.</span>
            </h2>
            <p className="text-lg md:text-xl text-sage-mist/90 mb-10 leading-relaxed">
              Log cleanups, report maintenance issues, and track your impact on East Bay's unique ecosystem.
              Earn rewards while keeping our forests green.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="btn-poppy py-4 px-8 text-lg flex items-center justify-center gap-2"
              >
                Get Started <ChevronRight size={20} />
              </button>
              <button
                onClick={() => navigate('/community-board')}
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full transition-all text-center"
              >
                View Live Impact
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-10%] right-[-5%] opacity-10 pointer-events-none">
            <Trees size={400} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="organic-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-poppy/10 flex items-center justify-center mb-6 border border-poppy/20">
              <MapPin size={32} className="text-poppy" />
            </div>
            <h3 className="text-2xl font-heading mb-3">Report Issues</h3>
            <p className="text-forest-deep/70">
              Spot a fallen redwood or trail erosion? Pin it instantly to alert maintenance crews.
            </p>
          </div>

          <div className="organic-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center mb-6 border border-forest/20">
              <Leaf size={32} className="text-forest" />
            </div>
            <h3 className="text-2xl font-heading mb-3">Log Cleanups</h3>
            <p className="text-forest-deep/70">
              Track trash collected and upload photos. Every pound makes a measurable difference.
            </p>
          </div>

          <div className="organic-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-lupine/10 flex items-center justify-center mb-6 border border-lupine/20">
              <Award size={32} className="text-lupine" />
            </div>
            <h3 className="text-2xl font-heading mb-3">Earn Badges</h3>
            <p className="text-forest-deep/70">
              Unlock the "Poppy Protector" and "Redwood Guardian" badges as you contribute.
            </p>
          </div>
        </div>

        {/* Impact Quote */}
        <div className="max-w-3xl mx-auto text-center mb-20 px-4">
          <h3 className="text-3xl font-organic italic text-forest mb-6">
            "In every walk with nature, one receives far more than he seeks."
          </h3>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-earth-clay">— JOHN MUIR</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-forest-deep text-sage-mist py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h4 className="text-2xl font-heading font-bold text-white mb-4">East Bay Trail Tracker</h4>
            <p className="text-sage-mist/60 max-w-sm">
              Dedicated to the preservation and enjoyment of California's East Bay trail networks.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-sage-mist/40">&copy; 2024 Trail Tracker. Built for the Forest.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
