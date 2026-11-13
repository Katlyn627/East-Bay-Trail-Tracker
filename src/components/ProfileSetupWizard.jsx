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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 px-4 py-8 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-sage-mist/95 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between border-b border-forest-light/10 bg-white/80 backdrop-blur-md px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-moss">
              Nature Connection
            </p>
            <h2 className="font-heading text-2xl font-bold text-forest-deep">Complete your trail profile</h2>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-forest-moss transition hover:bg-forest-light/10"
            aria-label="Close profile wizard"
            disabled
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Sparkles size={16} className="text-poppy" />
                  Trail Name (Display Name)
                </span>
              </label>
              <input
                type="text"
                name="displayName"
                value={formValues.displayName}
                onChange={handleChange}
                placeholder="e.g., Redwood Runner"
                className="nature-input shadow-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-forest-evergreen" />
                  Favorite Local Trail
                </span>
              </label>
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
                  placeholder="Search California trails..."
                  className="nature-input shadow-sm pr-10"
                />
                <Search size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest-moss" />
                {showHomeTrailSuggestions && homeTrailSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-forest-light/10 bg-white/95 backdrop-blur-md shadow-xl py-2">
                    {homeTrailSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setFormValues((prev) => ({ ...prev, homeTrail: suggestion.name }));
                          setShowHomeTrailSuggestions(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-forest-deep hover:bg-forest-evergreen hover:text-white transition-colors"
                      >
                        <span>{suggestion.displayName}</span>
                        {suggestion.source === 'google' && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-forest-moss/60 group-hover:text-white/70">Maps</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Target size={16} className="text-forest-evergreen" />
                  Base Location
                </span>
              </label>
              <input
                type="text"
                name="location"
                value={formValues.location}
                onChange={handleChange}
                placeholder="e.g., Oakland, CA"
                className="nature-input shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Trophy size={16} className="text-poppy" />
                  Your Bio
                </span>
              </label>
              <textarea
                name="bio"
                value={formValues.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about your connection to the trails..."
                className="nature-input shadow-sm resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Preferred Distance Units</label>
              <div className="inline-flex rounded-2xl border-2 border-white bg-white/50 p-1.5 shadow-sm">
                {['miles', 'kilometers'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setFormValues((prev) => ({ ...prev, preferredUnits: unit }))}
                    className={`rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
                      formValues.preferredUnits === unit
                        ? 'bg-forest-evergreen text-white shadow-md'
                        : 'text-forest-moss hover:text-forest-deep hover:bg-white/50'
                    }`}
                  >
                    {unit === 'miles' ? 'Miles' : 'Kilometers'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-forest-light/10 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-nature min-w-[160px]"
            >
              {loading ? 'Saving Profile...' : 'Save & Explore'}
            </button>
          </div>
        </form>
      </div>
    </div>

  );
}

export default ProfileSetupWizard;
