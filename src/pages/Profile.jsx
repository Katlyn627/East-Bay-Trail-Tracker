import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  CalendarDays,
  Camera,
  Clock3,
  Feather,
  ImageOff,
  Leaf,
  Mail,
  MapPinned,
  Mountain,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trees,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WILDLIFE_BADGES = [
  {
    id: 'redwood-sentinel',
    title: 'Redwood Sentinel',
    milestone: '100+ miles logged',
    icon: Mountain,
    progress: (stats) => stats.totalMiles,
    target: 100,
    accent: 'from-[#112A1F] via-[#1B4332] to-[#2D6A4F]',
  },
  {
    id: 'red-fox-trailblazer',
    title: 'Red Fox Trailblazer',
    milestone: '5+ unique parks explored',
    icon: PawPrint,
    progress: (stats) => stats.uniqueTrailsCount,
    target: 5,
    accent: 'from-[#D94F2B] via-[#C96F3D] to-[#F6B26B]',
  },
  {
    id: 'golden-eagle-guardian',
    title: 'Golden Eagle Guardian',
    milestone: '50+ volunteer hours',
    icon: Feather,
    progress: (stats) => stats.totalHours,
    target: 50,
    accent: 'from-[#664F1A] via-[#D4A373] to-[#F7C76A]',
  },
  {
    id: 'native-fern-protector',
    title: 'Native Fern Protector',
    milestone: '10+ trash cleanups completed',
    icon: Sprout,
    progress: (stats) => stats.totalBags,
    target: 10,
    accent: 'from-[#1B4332] via-[#2D6A4F] to-[#95D5B2]',
  },
  {
    id: 'grizzly-steward',
    title: 'California Grizzly Steward',
    milestone: 'Top community contributor',
    icon: Trees,
    progress: (stats) => stats.pointsBalance,
    target: 1000,
    accent: 'from-[#2D6A4F] via-[#52B788] to-[#D7F1DB]',
  },
];

const TIER_MILESTONES = [
  { name: 'Sprout Tier', target: 100, perk: 'Starter stewardship badge bundle' },
  { name: 'Canopy Tier', target: 300, perk: 'Priority RSVP badge + recognition highlight' },
  { name: 'Ridge Tier', target: 600, perk: 'Community leader spotlight + partner perks' },
  { name: 'Summit Tier', target: 1000, perk: 'Top steward status and annual impact honors' },
];

const EBTT_LOGO_SRC = '/ebtt-logo-badge.svg';

const toNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const clampPercent = (value) => Math.max(0, Math.min(100, value));
const formatMetric = (value) => toNumber(value).toLocaleString();
const formatDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const Profile = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const displayName = userProfile?.displayName || user?.displayName || 'Trail Explorer';
  const joinDateValue = userProfile?.createdAt || user?.metadata?.creationTime || userProfile?.joinDate;
  const profileImage = userProfile?.photoURL || user?.photoURL || '';
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('Please choose an image smaller than 5MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploadingImage(true);
        setUploadMessage('');
        await updateUserProfile({ photoURL: String(reader.result) });
      } catch (error) {
        setUploadMessage(error.message || 'Unable to upload profile photo.');
      } finally {
        setIsUploadingImage(false);
        event.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteProfileImage = async () => {
    try {
      setUploadMessage('');
      await updateUserProfile({ photoURL: '' });
    } catch (error) {
      setUploadMessage(error.message || 'Unable to clear profile photo.');
    }
  };

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
      WILDLIFE_BADGES.map((badge) => {
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

  const unlockedCount = badgeProgress.filter((badge) => badge.unlocked).length;

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

  const nextTier = tierProgress.find((tier) => !tier.achieved) || tierProgress[tierProgress.length - 1];
  const nextTierGap = Math.max(0, nextTier.target - userStats.pointsBalance);

  return (
    <div className="space-y-5">
      <section className="brand-hero-banner">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#52B788]/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[#D4A373]/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#2D6A4F]/20 bg-[#112A1F] shadow-md transition hover:scale-[1.02]"
                  aria-label="Upload profile picture"
                >
                  {profileImage ? (
                    <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <img src={EBTT_LOGO_SRC} alt="East Bay Trail Tracker logo" className="h-full w-full object-cover p-1.5" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-[#112A1F]/60 opacity-0 transition group-hover:opacity-100">
                    <Camera size={16} className="text-white" />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
                {profileImage && (
                  <button
                    type="button"
                    onClick={handleDeleteProfileImage}
                    className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4A373]/30 bg-[#FFF8EE] text-[#1B4332] shadow-sm transition hover:bg-[#F3E3D0]"
                    aria-label="Remove profile picture"
                  >
                    <ImageOff size={14} />
                  </button>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
                  {userProfile?.role || user?.role || 'Trail Volunteer'}
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-white">{displayName}</h2>
                <p className="mt-2 max-w-xl text-sm text-white/90">
                  Protecting trails, tracking cleanups, and growing a healthier East Bay landscape one mile at a time.
                </p>
                {uploadMessage && <p className="mt-2 text-xs text-[#F7B733]">{uploadMessage}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#2D6A4F]/15 bg-[#F4F9F4] px-3 py-2 text-sm font-semibold text-[#1B4332] shadow-sm">
                <Trophy size={16} className="text-[#2D6A4F]" />
                {unlockedCount} / {WILDLIFE_BADGES.length} badges earned
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D4A373]/30 bg-[#FFF8EE] px-3 py-2 text-sm font-semibold text-[#1B4332] shadow-sm">
                <Award size={16} className="text-[#8B6A4F]" />
                {formatMetric(userStats.pointsBalance)} points
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#B7D7BF] bg-[#FAFDFC] p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#1B4332]/70">
                <Mail size={15} className="text-[#2D6A4F]" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Email</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#112A1F]">{user?.email || userProfile?.email || 'No email available'}</p>
            </div>
            <div className="rounded-2xl border border-[#B7D7BF] bg-[#FAFDFC] p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#1B4332]/70">
                <CalendarDays size={15} className="text-[#2D6A4F]" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Joined</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#112A1F]">{formatDate(joinDateValue)}</p>
            </div>
            <div className="rounded-2xl border border-[#B7D7BF] bg-[#FAFDFC] p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#1B4332]/70">
                <User size={15} className="text-[#2D6A4F]" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Profile</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#112A1F]">Trail volunteer • habitat steward</p>
            </div>
          </div>
        </div>
      </section>

      <section className="organic-card border border-[rgba(139,94,60,0.28)] bg-[var(--ebtt-white)] p-5 shadow-[0_16px_32px_rgba(26,77,58,0.08)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2D6A4F]">Impact</p>
            <h3 className="text-2xl font-black text-[var(--ebtt-deep-forest)]">Impact snapshot</h3>
          </div>
          <div className="rounded-full border border-[#D4A373]/25 bg-[#FFF8EE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]">
            Stewardship summary
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#BFE7CB] bg-[#ECF9F1] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/75">Trash bags</p>
              <Leaf size={18} className="text-[#2D6A4F]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#112A1F]">{formatMetric(userStats.totalBags)}</p>
          </div>

          <div className="rounded-2xl border border-[#CFE8D5] bg-[#F1FAF4] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/75">Miles hiked</p>
              <MapPinned size={18} className="text-[#2D6A4F]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#112A1F]">{formatMetric(userStats.totalMiles)}</p>
          </div>

          <div className="rounded-2xl border border-[#F0D9B8] bg-[#FFF8EE] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/75">Volunteer hours</p>
              <Clock3 size={18} className="text-[#8B6A4F]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#112A1F]">{formatMetric(userStats.totalHours)}</p>
          </div>
        </div>
      </section>

      <section className="organic-card border border-[rgba(139,94,60,0.22)] bg-[#FDFCF9] p-5 shadow-[0_16px_32px_rgba(26,77,58,0.08)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2D6A4F]">Badges</p>
            <h3 className="text-2xl font-black text-[#112A1F]">Wildlife & plant badge collection</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE8D5] bg-[#F0FAF3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2D6A4F]">
            <Sparkles size={14} />
            Progress tracking enabled
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badgeProgress.map((badge) => {
            const Icon = badge.icon;
            return (
              <article
                key={badge.id}
                className="group relative overflow-hidden rounded-2xl border border-[#D5E6D9] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${badge.accent}`} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]">{badge.milestone}</p>
                    <h4 className="mt-2 text-lg font-bold text-[#112A1F]">{badge.title}</h4>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${badge.accent} text-white shadow-sm`}>
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-3 text-sm text-[#1B4332]/75">
                  {badge.unlocked ? 'Unlocked and active on your profile.' : `${Math.max(0, badge.target - badge.currentValue)} away from the next unlock.`}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#1B4332]/75">
                    <span>
                      {formatMetric(badge.currentValue)} / {formatMetric(badge.target)}
                    </span>
                    <span>{Math.round(badge.percent)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#E7EFE8]">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${badge.accent}`}
                      style={{ width: `${badge.percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1B4332]">
                  {badge.unlocked ? (
                    <>
                      <ShieldCheck size={14} className="text-[#2D6A4F]" />
                      Unlock complete
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-[#D4A373]" />
                      In progress
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="organic-card border border-[rgba(139,94,60,0.22)] bg-white p-5 shadow-[0_16px_32px_rgba(26,77,58,0.08)] sm:p-6">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-[#2D6A4F]" />
          <h3 className="text-2xl font-black text-[#112A1F]">Tier rewards</h3>
        </div>

        <div className="mt-4 space-y-3">
          {tierProgress.map((tier) => (
            <article key={tier.name} className="rounded-2xl border border-[#DCEFE0] bg-[#F7FBF8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#112A1F]">
                  <Trees size={15} className="text-[#2D6A4F]" />
                  {tier.name}
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]">{tier.target} points</span>
              </div>

              <p className="mt-1 text-sm text-[#1B4332]/75">{tier.perk}</p>

              <div className="mt-3 h-2.5 w-full rounded-full bg-[#E4EFE6]">
                <div
                  className={`h-2.5 rounded-full ${tier.achieved ? 'bg-[#1B4332]' : 'bg-[#52B788]'}`}
                  style={{ width: `${tier.achieved ? 100 : tier.progressInsideTier}%` }}
                />
              </div>

              <p className="mt-2 text-xs font-semibold text-[#1B4332]">
                {tier.achieved ? 'Unlocked' : `${Math.round(tier.progressInsideTier)}% toward this tier`}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-[#D4A373]/25 bg-[#FFF8EE] p-3 text-sm text-[#1B4332]/80">
          <p className="inline-flex items-center gap-2 font-semibold text-[#112A1F]">
            <Sprout size={15} className="text-[#2D6A4F]" />
            Next objective
          </p>
          <p className="mt-1">
            Reach {formatMetric(nextTierGap)} more points to unlock the {nextTier.name.toLowerCase()} reward.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Profile;
