import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Leaf, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Community Board', to: '/leaderboard' },
  { label: 'Profile', to: '/profile' },
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
    <div className="min-h-screen bg-[#F4F6F0]">
      <header className="sticky top-0 z-30 border-b border-white/30 bg-[#1B4332] shadow-lg">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#D4A373] bg-white shadow-md">
              <Leaf size={22} className="text-[#52B788]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4A373]">East Bay Trail Tracker</p>
              <h1 className="text-lg font-bold text-white">Stewardship Portal</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#52B788] text-[#1B4332] shadow-sm'
                      : 'text-white hover:bg-white/15'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogOut}
              className="ml-1 inline-flex items-center gap-2 rounded-lg border border-[#D4A373] px-3 py-2 text-sm font-semibold text-[#D4A373] transition hover:bg-[#D4A373] hover:text-[#1B4332]"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
