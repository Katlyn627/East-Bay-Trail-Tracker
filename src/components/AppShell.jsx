import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Feather, LogOut, Trees, User, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Community', to: '/community-board', icon: MessageSquare },
];

const AppShell = () => {
  const { logOut, user, userProfile } = useAuth();
  const navigate = useNavigate();
  const profilePhoto = userProfile?.photoURL || user?.photoURL || '';

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-sage-mist nature-pattern flex flex-col">
      {/* Top Navigation Bar - Desktop & Mobile Branding */}
      <header className="sticky top-0 z-40 bg-forest/90 backdrop-blur-md border-b border-forest-light/20 shadow-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white shadow-inner flex items-center justify-center overflow-hidden">
               <img src="/ebtt-app-icon.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-poppy-light">TRAIL HUB</p>
              <h1 className="text-lg font-heading text-white leading-tight">East Bay Trails</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-poppy text-white shadow-md'
                        : 'text-sage-mist/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
            <div className="h-6 w-px bg-white/20 mx-2"></div>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `group flex items-center gap-2 transition-all ${isActive ? 'scale-110' : ''}`
              }
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="h-9 w-9 rounded-full border-2 border-poppy object-cover shadow-sm transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-white border-2 border-white/20">
                  <User size={20} />
                </div>
              )}
            </NavLink>
            <button
              onClick={handleLogOut}
              className="ml-2 p-2 text-sage-mist/60 hover:text-poppy transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile Profile & Logout */}
          <div className="flex md:hidden items-center gap-4">
             <NavLink to="/profile">
               {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-8 w-8 rounded-full border-2 border-poppy" />
               ) : (
                  <User size={24} className="text-white" />
               )}
             </NavLink>
             <button onClick={handleLogOut} className="text-white/70">
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="glass-nav md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-forest font-bold' : 'text-forest-moss/60'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-[10px] uppercase tracking-tighter">{item.label}</span>
            </NavLink>
          );
        })}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-forest font-bold' : 'text-forest-moss/60'
            }`
          }
        >
          <User size={24} />
          <span className="text-[10px] uppercase tracking-tighter">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AppShell;
