import React, { useEffect, useState } from 'react';
import { MapPin, Sparkles, Target, Trophy, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const defaultFormValues = {
  displayName: '',
  homeTrail: '',
  location: '',
  bio: '',
  preferredUnits: 'miles',
};

function ProfileSetupWizard() {
  const { userProfile, completeProfileSetup } = useAuth();
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormValues({
        displayName: userProfile.displayName || '',
        homeTrail: userProfile.homeTrail || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        preferredUnits: userProfile.preferredUnits || 'miles',
      });
    }
  }, [userProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formValues.displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    if (!formValues.homeTrail.trim() || !formValues.location.trim()) {
      setError('Please add your home trail and a home location.');
      return;
    }

    if (!formValues.bio.trim()) {
      setError('Tell us a little bit about yourself so fellow trail users know you.');
      return;
    }

    try {
      setLoading(true);
      await completeProfileSetup({
        displayName: formValues.displayName.trim(),
        homeTrail: formValues.homeTrail.trim(),
        location: formValues.location.trim(),
        bio: formValues.bio.trim(),
        preferredUnits: formValues.preferredUnits,
      });
    } catch (err) {
      setError(err.message || 'Unable to save your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Welcome aboard
            </p>
            <h2 className="text-2xl font-bold text-slate-900">Complete your trail profile</h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close profile wizard"
            disabled
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Sparkles size={16} className="text-emerald-600" />
                Display Name
              </span>
              <input
                type="text"
                name="displayName"
                value={formValues.displayName}
                onChange={handleChange}
                placeholder="Trail Explorer"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin size={16} className="text-emerald-600" />
                Home Trail
              </span>
              <input
                type="text"
                name="homeTrail"
                value={formValues.homeTrail}
                onChange={handleChange}
                placeholder="Tilden Regional Park"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Target size={16} className="text-emerald-600" />
                Home Location
              </span>
              <input
                type="text"
                name="location"
                value={formValues.location}
                onChange={handleChange}
                placeholder="Oakland, CA"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Trophy size={16} className="text-emerald-600" />
                Bio
              </span>
              <textarea
                name="bio"
                value={formValues.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Weekend trail runner, community cleanup volunteer, and wildlife advocate..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Preferred Units</span>
              <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                {['miles', 'kilometers'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setFormValues((prev) => ({ ...prev, preferredUnits: unit }))}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      formValues.preferredUnits === unit
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {unit === 'miles' ? 'Miles' : 'Kilometers'}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetupWizard;
