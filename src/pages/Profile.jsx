import React, { useMemo } from 'react';
import { Award, Leaf, MapPinned, Mountain, Route, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BADGE_DEFINITIONS = [
  {
    id: 'trailblazer',
    title: 'Trailblazer',
    description: 'Log 25 total miles on cleanup hikes.',
    icon: Route,
    progress: (stats) => stats.totalMiles,
    target: 25,
    accent: 'bg-[#dff4ea] text-[#1B4332]',
  },
  {
    id: 'cleanup-champion',
    title: 'Cleanup Champion',
    description: 'Collect 100 bags of trash across local trails.',
    icon: Trophy,
    progress: (stats) => stats.totalBags,
    target: 100,
    accent: 'bg-[#fdf1e4] text-[#7c5738]',
  },
  {
    id: 'ecosystem-protector',
    title: 'Ecosystem Protector',
    description: 'Contribute 60 volunteer hours to stewardship efforts.',
    icon: Leaf,
    progress: (stats) => stats.totalHours,
    target: 60,
    accent: 'bg-[#e9f7ef] text-[#1B4332]',
  },
];

const TIER_MILESTONES = [
  { name: 'Sprout Tier', target: 100, perk: 'Starter stewardship badge bundle' },
  { name: 'Canopy Tier', target: 300, perk: 'Priority RSVP badge + recognition highlight' },
  { name: 'Ridge Tier', target: 600, perk: 'Community leader spotlight + partner perks' },
  { name: 'Summit Tier', target: 1000, perk: 'Top steward status and annual impact honors' },
];

const toNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const clampPercent = (value) => Math.max(0, Math.min(100, value));
const formatMetric = (value) => toNumber(value).toLocaleString();

const Profile = () => {
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.displayName || user?.displayName || 'Trail Explorer';
  const userStats = useMemo(
    () => ({
      totalBags: toNumber(userProfile?.totalBags ?? userProfile?.trashBagsCollected),
      totalMiles: toNumber(userProfile?.totalMiles ?? userProfile?.milesLogged),
      totalHours: toNumber(userProfile?.totalHours ?? userProfile?.volunteerHours),
      totalWeightLbs: toNumber(userProfile?.totalWeightLbs),
      pointsBalance: toNumber(userProfile?.pointsBalance),
      uniqueTrailsCount: Array.isArray(userProfile?.uniqueTrails) ? userProfile.uniqueTrails.length : 0,
    }),
    [userProfile]
  );

  const badgeProgress = useMemo(
    () =>
      BADGE_DEFINITIONS.map((badge) => {
        const currentValue = toNumber(badge.progress(userStats));
        const percent = clampPercent((currentValue / badge.target) * 100);
        return {
          ...badge,
          currentValue,
          percent,
          unlocked: currentValue >= badge.target,
        };
      }),
    [userStats]
  );

  const tierProgress = useMemo(
    () =>
      TIER_MILESTONES.map((tier, index) => {
        const previousTarget = index === 0 ? 0 : TIER_MILESTONES[index - 1].target;
        const span = tier.target - previousTarget;
        const progressInsideTier = clampPercent(((userStats.pointsBalance - previousTarget) / span) * 100);
        return {
          ...tier,
          achieved: userStats.pointsBalance >= tier.target,
          progressInsideTier,
        };
      }),
    [userStats.pointsBalance]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">User Profile</p>
            <h2 className="text-2xl font-bold text-[#1B4332]">Profile & Badges</h2>
            <p className="mt-1 text-sm text-[#1B4332]/75">Track your impact and unlock stewardship milestones.</p>
          </div>
          <div className="rounded-xl border border-[#52B788]/25 bg-[#ecf9f1] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Points Balance</p>
            <p className="text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.pointsBalance)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#52B788]/25 bg-[#52B788]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/75">Display Name</p>
            <p className="font-semibold text-[#1B4332]">{displayName}</p>
          </div>
          <div className="rounded-xl border border-[#52B788]/25 bg-[#52B788]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/75">Email</p>
            <p className="font-semibold text-[#1B4332]">{user?.email || userProfile?.email || 'No email available'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <h3 className="text-xl font-bold text-[#1B4332]">Total Impact Snapshot</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[#52B788]/25 bg-[#ecf9f1] p-4">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Trash Bags Collected</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.totalBags)}</p>
          </div>
          <div className="rounded-xl border border-[#87d6d3]/35 bg-[#ebf7f8] p-4">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Miles Hiked</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.totalMiles)}</p>
          </div>
          <div className="rounded-xl border border-[#D4A373]/35 bg-[#fff4e8] p-4">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Volunteer Hours</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.totalHours)}</p>
          </div>
          <div className="rounded-xl border border-[#b8d8c6]/45 bg-[#f2faf4] p-4">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Unique Trails Cleaned</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.uniqueTrailsCount)}</p>
          </div>
          <div className="rounded-xl border border-[#D4A373]/30 bg-[#fff8f2] p-4">
            <p className="text-xs uppercase tracking-wide text-[#1B4332]/70">Trash Weight Removed (lbs)</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{formatMetric(userStats.totalWeightLbs)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <h3 className="text-xl font-bold text-[#1B4332]">Badges & Achievements Showcase</h3>
        <p className="mt-1 text-sm text-[#1B4332]/75">Unlock badges by reaching cleanup, mileage, and service milestones.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {badgeProgress.map((badge) => {
            const Icon = badge.icon;
            return (
              <article key={badge.id} className="rounded-xl border border-[#D4A373]/25 bg-[#fffdf9] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#1B4332]">{badge.title}</h4>
                    <p className="mt-1 text-xs text-[#1B4332]/75">{badge.description}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${badge.accent}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-[#1B4332]/75">
                    <span>
                      {formatMetric(badge.currentValue)} / {formatMetric(badge.target)}
                    </span>
                    <span>{Math.round(badge.percent)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#e6eee8]">
                    <div className="h-2 rounded-full bg-[#52B788]" style={{ width: `${badge.percent}%` }} />
                  </div>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332]">
                  {badge.unlocked ? (
                    <>
                      <ShieldCheck size={13} className="text-[#52B788]" />
                      Unlocked
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#D4A373]" />
                      In progress
                    </>
                  )}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <h3 className="text-xl font-bold text-[#1B4332]">Milestones & Tier Rewards</h3>
        <p className="mt-1 text-sm text-[#1B4332]/75">
          Build your points to unlock tier rewards and community recognition.
        </p>
        <div className="mt-4 space-y-3">
          {tierProgress.map((tier) => (
            <article key={tier.name} className="rounded-xl border border-[#52B788]/20 bg-[#f7fcf9] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <Award size={15} className="text-[#1B4332]" />
                  <h4 className="text-sm font-semibold text-[#1B4332]">{tier.name}</h4>
                </div>
                <p className="text-xs font-semibold text-[#1B4332]/80">{tier.target} points</p>
              </div>
              <p className="mt-1 text-xs text-[#1B4332]/75">{tier.perk}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[#deebdf]">
                <div
                  className={`h-2 rounded-full ${tier.achieved ? 'bg-[#1B4332]' : 'bg-[#52B788]'}`}
                  style={{ width: `${tier.achieved ? 100 : tier.progressInsideTier}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#1B4332]">
                {tier.achieved ? 'Unlocked' : `${Math.round(tier.progressInsideTier)}% toward this tier`}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#D4A373]/35 bg-[#fff8f2] p-3 text-sm text-[#1B4332]/80">
          <p className="inline-flex items-center gap-2 font-semibold text-[#1B4332]">
            <Mountain size={15} />
            Next objective
          </p>
          <p className="mt-1">
            Reach {formatMetric(Math.max(0, (tierProgress.find((tier) => !tier.achieved)?.target || 0) - userStats.pointsBalance))}{' '}
            more points to unlock your next tier reward.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
        <h3 className="text-xl font-bold text-[#1B4332]">Stewardship Focus Areas</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#52B788]/25 bg-[#ecf9f1] p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
              <MapPinned size={15} />
              Trail Coverage
            </p>
            <p className="mt-1 text-xs text-[#1B4332]/75">
              Keep expanding your impact by cleaning new trails and parks across the East Bay and California.
            </p>
          </div>
          <div className="rounded-xl border border-[#D4A373]/30 bg-[#fff6ec] p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
              <Leaf size={15} />
              Habitat Protection
            </p>
            <p className="mt-1 text-xs text-[#1B4332]/75">
              Document hazards and cleanup outcomes to help partner organizations prioritize ecosystem restoration.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
