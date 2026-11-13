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
    accent: 'from-forest-deep via-forest to-forest-light',
  },
  {
    id: 'red-fox-trailblazer',
    title: 'Red Fox Trailblazer',
    milestone: '5+ unique parks explored',
    icon: PawPrint,
    progress: (stats) => stats.uniqueTrailsCount,
    target: 5,
    accent: 'from-poppy via-earth-clay to-poppy-light',
  },
  {
    id: 'golden-eagle-guardian',
    title: 'Golden Eagle Guardian',
    milestone: '50+ volunteer hours',
    icon: Feather,
    progress: (stats) => stats.totalHours,
    target: 50,
    accent: 'from-earth via-earth-sand to-gold',
  },
  {
    id: 'native-fern-protector',
    title: 'Native Fern Protector',
    milestone: '10+ trash cleanups completed',
    icon: Sprout,
    progress: (stats) => stats.totalBags,
    target: 10,
    accent: 'from-forest-deep via-forest to-forest-moss',
  },
  {
    id: 'grizzly-community-champion',
    title: 'California Grizzly Community Champion',
    milestone: 'Top community contributor',
    icon: Trees,
    progress: (stats) => stats.pointsBalance,
    target: 1000,
    accent: 'from-forest via-forest-moss to-sage-mist',
  },
];

const TIER_MILESTONES = [
  { name: 'Sprout Tier', target: 100, perk: 'Starter impact badge bundle' },
  { name: 'Canopy Tier', target: 300, perk: 'Priority RSVP badge + recognition highlight' },
  { name: 'Ridge Tier', target: 600, perk: 'Community leader spotlight + partner perks' },
  { name: 'Summit Tier', target: 1000, perk: 'Top community contributor status and annual impact honors' },
];

const EBTT_LOGO_SRC = '/ebtt-app-icon.png';

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
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden organic-card bg-forest-gradient p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border-2 border-white/20 bg-forest-deep shadow-xl transition hover:scale-105"
                  aria-label="Upload profile picture"
                >
                  {profileImage ? (
                    <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <img src={EBTT_LOGO_SRC} alt="Logo" className="h-full w-full object-cover p-3 opacity-90" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-forest-deep/60 opacity-0 transition group-hover:opacity-100">
                    <Camera size={24} className="text-white" />
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
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-poppy text-white shadow-lg transition hover:bg-poppy-light"
                    aria-label="Remove profile picture"
                  >
                    <ImageOff size={14} />
                  </button>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-poppy-light">
                  {userProfile?.role || user?.role || 'Trail Volunteer'}
                </p>
                <h2 className="mt-1 text-4xl font-heading font-black text-white">{displayName}</h2>
                <p className="mt-3 max-w-xl text-sm text-sage-mist/90 leading-relaxed font-medium">
                  Protecting trails, tracking cleanups, and growing a healthier East Bay landscape one mile at a time.
                </p>
                {uploadMessage && <p className="mt-2 text-xs text-gold font-bold">{uploadMessage}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white shadow-md">
                <Trophy size={16} className="text-gold" />
                {unlockedCount} / {WILDLIFE_BADGES.length} badges
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-poppy/20 bg-poppy/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white shadow-md">
                <Award size={16} className="text-poppy-light" />
                {formatMetric(userStats.pointsBalance)} points
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 text-sage-mist/70">
                <Mail size={15} className="text-poppy-light" />
                <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white truncate">{user?.email || userProfile?.email || 'No email available'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 text-sage-mist/70">
                <CalendarDays size={15} className="text-poppy-light" />
                <span className="text-[10px] font-black uppercase tracking-widest">Joined</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{formatDate(joinDateValue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 text-sage-mist/70">
                <User size={15} className="text-poppy-light" />
                <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">Trail volunteer • park advocate</p>
            </div>
          </div>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Trees size={300} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="organic-card p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Conservation Impact</p>
              <h3 className="text-2xl font-heading text-forest-deep">Impact Snapshot</h3>
            </div>
            <div className="rounded-full bg-sage-mist px-4 py-2 text-[10px] font-black uppercase tracking-widest text-forest">
              Stats
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 flex-1">
            <div className="rounded-[2rem] rounded-tr-lg rounded-bl-lg border border-forest/10 bg-forest/5 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-forest-moss">Bags</p>
                <Leaf size={20} className="text-forest" />
              </div>
              <p className="text-3xl font-black text-forest-deep">{formatMetric(userStats.totalBags)}</p>
            </div>

            <div className="rounded-[2rem] rounded-tl-lg rounded-br-lg border border-lupine/10 bg-lupine/5 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-lupine">Miles</p>
                <MapPinned size={20} className="text-lupine" />
              </div>
              <p className="text-3xl font-black text-forest-deep">{formatMetric(userStats.totalMiles)}</p>
            </div>

            <div className="rounded-[2rem] rounded-tr-lg rounded-bl-lg border border-poppy/10 bg-poppy/5 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-poppy">Hours</p>
                <Clock3 size={20} className="text-poppy" />
              </div>
              <p className="text-3xl font-black text-forest-deep">{formatMetric(userStats.totalHours)}</p>
            </div>
          </div>
        </section>

        <section className="organic-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-poppy/10 border border-poppy/20">
              <Award size={24} className="text-poppy" />
            </div>
            <h3 className="text-2xl font-heading text-forest-deep">Tier Rewards</h3>
          </div>

          <div className="space-y-4">
            {tierProgress.map((tier) => (
              <article key={tier.name} className="rounded-2xl border border-sage-mist bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-forest-deep">
                    <Trees size={16} className={tier.achieved ? 'text-forest' : 'text-forest-moss'} />
                    {tier.name}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-forest-moss">{tier.target} pts</span>
                </div>

                <p className="mt-1 text-xs font-medium text-forest-deep/60">{tier.perk}</p>

                <div className="mt-3 h-2.5 w-full rounded-full bg-sage-mist overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${tier.achieved ? 'bg-forest' : 'bg-forest-moss'}`}
                    style={{ width: `${tier.achieved ? 100 : tier.progressInsideTier}%` }}
                  />
                </div>

                <p className="mt-2 text-[10px] font-black uppercase text-forest">
                  {tier.achieved ? 'Unlocked' : `${Math.round(tier.progressInsideTier)}% complete`}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border-2 border-dashed border-poppy/20 bg-poppy/5 p-4">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-poppy">
              <Sprout size={16} />
              Next objective
            </p>
            <p className="mt-1 text-sm font-bold text-forest-deep/80">
              Reach {formatMetric(nextTierGap)} more points to unlock {nextTier.name}.
            </p>
          </div>
        </section>
      </div>

      <section className="organic-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Collection</p>
            <h3 className="text-2xl font-heading text-forest-deep">Wildlife & Plant Badges</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-forest">
            <Sparkles size={14} />
            {unlockedCount} Earned
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {badgeProgress.map((badge) => {
            const Icon = badge.icon;
            return (
              <article
                key={badge.id}
                className="group relative overflow-hidden rounded-[2rem] border border-forest/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${badge.accent}`} />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-forest-moss">{badge.milestone}</p>
                    <h4 className="mt-2 text-lg font-heading font-bold text-forest-deep">{badge.title}</h4>
                  </div>
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${badge.accent} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                </div>

                <p className="mt-4 text-xs font-medium text-forest-deep/60 leading-relaxed">
                  {badge.unlocked ? 'Unlocked and active on your profile.' : `${Math.max(0, badge.target - badge.currentValue)} away from unlock.`}
                </p>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-forest-moss">
                    <span>
                      {formatMetric(badge.currentValue)} / {formatMetric(badge.target)}
                    </span>
                    <span>{Math.round(badge.percent)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-sage-mist overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ${badge.accent}`}
                      style={{ width: `${badge.percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  {badge.unlocked ? (
                    <span className="flex items-center gap-1.5 text-forest">
                      <ShieldCheck size={14} />
                      Badge Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-poppy">
                      <Sparkles size={14} />
                      Tracking
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Profile;
