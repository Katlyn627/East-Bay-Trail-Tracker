import React from 'react';
import { useAuth } from '../context/AuthContext';
import BrandedPlaceholderCard from '../components/BrandedPlaceholderCard';

const Profile = () => {
  const { user, userProfile } = useAuth();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">User Profile</p>
        <h2 className="mb-4 text-2xl font-bold text-[#1B4332]">Profile Overview</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#52B788]/25 bg-[#52B788]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/75">Display Name</p>
            <p className="font-semibold text-[#1B4332]">{userProfile?.displayName || 'Trail Explorer'}</p>
          </div>
          <div className="rounded-xl border border-[#52B788]/25 bg-[#52B788]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/75">Email</p>
            <p className="font-semibold text-[#1B4332]">{user?.email || 'No email available'}</p>
          </div>
        </div>
      </section>

      <BrandedPlaceholderCard
        subtitle="Profile Tools"
        title="Profile Management"
        note="Additional profile editing and preference controls will be added here next."
      />
    </div>
  );
};

export default Profile;
