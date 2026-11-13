import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Sparkles, Target, Trophy, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useCaliforniaTrailSearch from '../hooks/useCaliforniaTrailSearch';
import { buildGoogleMapsSearchUrl } from '../utils/maps';

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
  const [showHomeTrailSuggestions, setShowHomeTrailSuggestions] = useState(false);
  const [googleHomeTrailSuggestions, setGoogleHomeTrailSuggestions] = useState([]);
  const homeTrailSearch = useCaliforniaTrailSearch(formValues.homeTrail, { limit: 6, minQueryLength: 1 });

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

  useEffect(() => {
    const query = formValues.homeTrail.trim();
    if (query.length < 2) {
      setGoogleHomeTrailSuggestions([]);
      return;
    }

    if (typeof window === 'undefined' || !window.google?.maps?.places?.AutocompleteService) {
      setGoogleHomeTrailSuggestions([]);
      return;
    }

    let cancelled = false;
    const autocompleteService = new window.google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'us' },
        types: ['establishment', 'geocode'],
      },
      (predictions, status) => {
        if (cancelled) return;
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(predictions)) {
          setGoogleHomeTrailSuggestions([]);
          return;
        }

        const mappedPredictions = predictions.slice(0, 5).map((prediction) => ({
          id: prediction.place_id,
          name: prediction.structured_formatting?.main_text || prediction.description,
          displayName: prediction.description,
          source: 'google',
        }));

        setGoogleHomeTrailSuggestions(mappedPredictions);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [formValues.homeTrail]);

  const homeTrailSuggestions = useMemo(() => {
    const uniqueSuggestions = new Map();

    homeTrailSearch.suggestions.forEach((suggestion) => {
      uniqueSuggestions.set(suggestion.name.trim().toLowerCase(), {
        ...suggestion,
        source: 'local',
      });
    });

    googleHomeTrailSuggestions.forEach((suggestion) => {
      const suggestionKey = suggestion.name.trim().toLowerCase();
      if (!uniqueSuggestions.has(suggestionKey)) {
        uniqueSuggestions.set(suggestionKey, suggestion);
      }
    });

    return Array.from(uniqueSuggestions.values()).slice(0, 8);
  }, [googleHomeTrailSuggestions, homeTrailSearch.suggestions]);

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
      <div className="brand-card brand-glass-panel w-full max-w-2xl overflow-hidden">
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
              <div className="relative">
                <input
                  type="text"
                  name="homeTrail"
                  value={formValues.homeTrail}
                  onChange={(event) => {
                    handleChange(event);
                    setShowHomeTrailSuggestions(true);
                  }}
                  onFocus={() => setShowHomeTrailSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowHomeTrailSuggestions(false), 120)}
                  placeholder="Search any California trail or park"
                  className="input-field pr-9"
                />
                <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1B4332]/55" />
                {showHomeTrailSuggestions && homeTrailSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[#D4A373]/30 bg-white shadow-lg">
                    {homeTrailSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setFormValues((prev) => ({ ...prev, homeTrail: suggestion.name }));
                          setShowHomeTrailSuggestions(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-[#1B4332] transition hover:bg-[#f5f8ef]"
                      >
                        <span>{suggestion.displayName}</span>
                        {suggestion.source === 'google' && (
                          <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]/75">Google</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formValues.homeTrail.trim() && (
                <a
                  href={buildGoogleMapsSearchUrl(formValues.homeTrail)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                >
                  📍 View on Google Maps
                </a>
              )}
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
