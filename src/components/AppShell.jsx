import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Feather, Leaf, LogOut, Trees, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Trees },
  { label: 'Community Board', to: '/community-board', icon: Feather },
  { label: 'Profile', to: '/profile', icon: User },
];

const AppShell = () => {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="forest-shell min-h-screen bg-[#F4F9F4] text-[#112A1F]">
      <header className="sticky top-0 z-30 border-b border-[#D7E7DB] bg-[#112A1F]/95 shadow-[0_16px_40px_rgba(17,42,31,0.18)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#D4A373] bg-[#F4F9F4] shadow-md">
              <Leaf size={22} className="text-[#2D6A4F]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#95D5B2]">East Bay Trail Tracker</p>
              <h1 className="text-lg font-bold text-white">Forest Stewardship Portal</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#52B788] text-[#112A1F] shadow-sm'
                        : 'text-[#EAF5EE] hover:bg-white/10'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={handleLogOut}
              className="ml-1 inline-flex items-center gap-2 rounded-lg border border-[#D4A373] px-3 py-2 text-sm font-semibold text-[#F3D5A3] transition hover:bg-[#D4A373] hover:text-[#112A1F]"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
