import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { Camera, Loader2, MapPin, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';
import useTrailLocationSearch from '../hooks/useTrailLocationSearch';
import { buildGoogleMapsSearchUrl, normalizeCoordinates } from '../utils/maps';

const ISSUE_TYPES = [
  { value: 'downed_tree', label: 'Downed Tree', icon: '🌳' },
  { value: 'overgrowth', label: 'Overgrowth', icon: '🌿' },
  { value: 'trash', label: 'Trash/Litter', icon: '🗑️' },
  { value: 'erosion', label: 'Erosion', icon: '⛰️' },
  { value: 'mudslide', label: 'Mudslide', icon: '🏔️' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

const MAX_PHOTOS = 5;

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readFileAsPreview = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve({ id: makeId(), file, preview: event.target.result });
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });

function ReportIssueModal({ isOpen, onClose, onSuccess }) {
  const { user, userProfile, updateUserProfile } = useAuth();
  const inputRef = useRef(null);
  const [formData, setFormData] = useState({
    issueType: 'downed_tree',
    trailName: '',
    description: '',
    latitude: '',
    longitude: '',
    severity: 'medium',
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTrailLocation, setSelectedTrailLocation] = useState(null);
  const { suggestions: trailSuggestions, loading: trailLoading, error: trailError, hasMore: trailHasMore } = useTrailLocationSearch(formData.trailName, {
    latitude: formData.latitude,
    longitude: formData.longitude,
  });
  const trailSearch = { suggestions: trailSuggestions, loading: trailLoading, error: trailError, hasMore: trailHasMore };
  const suggestionsRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback to default East Bay coordinates if not already set
        setFormData((prev) => ({
          ...prev,
          latitude: prev.latitude || '37.8734',
          longitude: prev.longitude || '-122.2634',
        }));
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [isOpen]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'trailName') {
      if (selectedTrailLocation && selectedTrailLocation.name !== value) {
        setSelectedTrailLocation(null);
      }
      setShowSuggestions(true);
    }
  };

  const handleTrailSelect = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      trailName: suggestion.name,
      latitude: suggestion.latitude ? suggestion.latitude.toFixed(6) : prev.latitude,
      longitude: suggestion.longitude ? suggestion.longitude.toFixed(6) : prev.longitude,
    }));
    setSelectedTrailLocation(suggestion);
    setShowSuggestions(false);
  };

  const handlePhotoSelection = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    try {
      if (replaceIndex !== null) {
        const replacement = await readFileAsPreview(incomingFiles[0]);
        setPhotos((prev) => prev.map((photo, index) => (index === replaceIndex ? replacement : photo)));
        setReplaceIndex(null);
      } else {
        if (photos.length + incomingFiles.length > MAX_PHOTOS) {
          setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
          return;
        }
        const loadedPhotos = await Promise.all(incomingFiles.map(readFileAsPreview));
        setPhotos((prev) => [...prev, ...loadedPhotos]);
      }
      setError('');
      event.target.value = '';
    } catch (err) {
      setError(err.message || 'Unable to add that photo.');
    }
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    if (replaceIndex !== null) setReplaceIndex(null);
  };

  const openReplacePicker = (index) => {
    setReplaceIndex(index);
    inputRef.current?.click();
  };

  const resetForm = () => {
    setFormData({
      issueType: 'downed_tree',
      trailName: '',
      description: '',
      latitude: '',
      longitude: '',
      severity: 'medium',
    });
    setSelectedTrailLocation(null);
    setShowSuggestions(false);
    setPhotos([]);
    setReplaceIndex(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('You must be signed in before reporting a trail issue.');
      return;
    }

    if (!formData.trailName.trim()) {
      setError('Please search for and select a trail or park.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required. Try re-searching for the trail.');
      return;
    }

    setLoading(true);

    try {
      const photoURLs = [];
      for (const photo of photos) {
        const url = await uploadTrailReportImage(photo.file, user.uid);
        photoURLs.push(url);
      }

      await addDoc(collection(db, 'trailReports'), {
        uid: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || 'Anonymous',
        userPhotoURL: userProfile?.photoURL || '',
        issueType: formData.issueType,
        trailName: formData.trailName,
        description: formData.description,
        severity: formData.severity,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        photoURLs,
        status: 'reported',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        verified: false,
      });

      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, {
          pointsBalance: increment(50),
          issuesReported: increment(1),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        if (updateUserProfile) {
          await updateUserProfile({
            pointsBalance: (userProfile?.pointsBalance || 0) + 50,
            issuesReported: (userProfile?.issuesReported || 0) + 1,
          });
        }
      } catch (userUpdateErr) {
        console.warn('Non-critical: Failed to update user stats document:', userUpdateErr);
      }

      onSuccess?.('Issue reported! You earned 50 points.');
      resetForm();
      onClose?.();
    } catch (err) {
      console.error('Report submission error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-forest-deep/60 px-3 py-5 backdrop-blur-md">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-2xl rounded-[2.5rem] bg-sage-mist/95 shadow-2xl border border-white/20 overflow-visible">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-forest-light/10 bg-white/80 backdrop-blur-md px-6 py-5 z-10 rounded-t-[2.5rem]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-moss">Guardian Action</p>
            <h2 className="font-heading text-2xl font-bold text-forest-deep">Report a Trail Issue</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-forest-moss transition hover:bg-forest-light/10 hover:text-forest-evergreen"
            aria-label="Close report issue modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div>
              <label className="mb-3 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Nature of Issue</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ISSUE_TYPES.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, issueType: entry.value }))}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-sm font-bold transition-all duration-300 ${
                      formData.issueType === entry.value
                        ? 'border-forest-evergreen bg-forest-evergreen text-white shadow-md'
                        : 'border-white bg-white text-forest-moss hover:border-forest-light/30 hover:bg-forest-light/5'
                    }`}
                  >
                    <span className="text-lg">{entry.icon}</span>
                    <span>{entry.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 relative" ref={suggestionsRef}>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Trail Name</label>
                  {formData.trailName.trim() && (
                    <a
                      href={buildGoogleMapsSearchUrl(
                        formData.trailName,
                        selectedTrailLocation?.name?.trim().toLowerCase() === formData.trailName.trim().toLowerCase()
                          ? selectedTrailLocation
                          : null
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-evergreen hover:text-forest-deep transition-colors bg-white/50 px-2 py-0.5 rounded-full shadow-sm"
                    >
                      <MapPin size={10} />
                      View on Google Maps
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="trailName"
                    value={formData.trailName}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                    placeholder="Search California trails or parks..."
                    className="nature-input pr-10 shadow-sm"
                    autoComplete="off"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-moss/50" />
                </div>

                {showSuggestions && (trailSearch.suggestions.length > 0 || trailSearch.loading) && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-forest-light/10 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin">
                    {trailSearch.loading && (
                      <div className="px-4 py-3 text-sm text-forest-moss flex items-center gap-2 bg-sage-mist/10">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Searching California trailheads...</span>
                      </div>
                    )}
                    {trailSearch.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleTrailSelect(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-sage-mist/20 flex items-center gap-3 transition-colors border-b border-forest-light/5 last:border-0"
                      >
                        <div className={`p-2 rounded-full ${suggestion.isTrailhead ? 'bg-poppy/10 text-poppy' : 'bg-forest-moss/10 text-forest-moss'}`}>
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-forest-deep text-sm flex items-center gap-2">
                            {suggestion.name}
                            {suggestion.isTrailhead && (
                              <span className="text-[9px] bg-poppy/10 text-poppy px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Trailhead</span>
                            )}
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tighter ${
                              suggestion.source === 'usgs' ? 'bg-blue-100 text-blue-700' :
                              suggestion.source === 'local' ? 'bg-green-100 text-green-700' :
                              suggestion.source === 'google' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {suggestion.source}
                            </span>
                          </div>
                          <div className="text-[10px] text-forest-moss/70 font-medium truncate">
                            {suggestion.displayName.includes(',')
                              ? suggestion.displayName.split(',').slice(1).join(',').trim()
                              : suggestion.displayName}
                          </div>
                        </div>
                      </button>
                    ))}
                    {trailSearch.hasMore && (
                      <div className="px-4 py-2 bg-forest-light/5 text-[10px] text-center font-bold text-forest-moss uppercase tracking-widest border-t border-forest-light/10">
                        Showing top results • Keep typing to refine
                      </div>
                    )}
                  </div>
                )}
                {trailSearch.error && <p className="mt-2 text-xs font-bold text-red-600 px-1">{trailSearch.error}</p>}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Description & Details</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the issue, location markers, and urgency..."
                  className="nature-input shadow-sm resize-none"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  placeholder="37.8734"
                  className="nature-input shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  placeholder="-122.2634"
                  className="nature-input shadow-sm"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Priority Level</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="nature-input shadow-sm appearance-none cursor-pointer"
                >
                  <option value="low">Low Priority (Maintenance needed)</option>
                  <option value="medium">Medium Priority (Action recommended)</option>
                  <option value="high">High Priority (Safety hazard)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Field Evidence</label>
                <span className="text-xs font-bold text-forest-moss bg-white px-2 py-1 rounded-full shadow-sm">
                  {photos.length} / {MAX_PHOTOS}
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={!replaceIndex}
                onChange={handlePhotoSelection}
                className="hidden"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm transition-all hover:shadow-md">
                    <img src={photo.preview} alt={`Issue preview ${index + 1}`} className="h-32 w-full object-cover" />
                    <div className="absolute inset-0 bg-forest-deep/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="rounded-full bg-red-500/90 p-2 text-white shadow-lg transition hover:bg-red-600 active:scale-90"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <button
                        type="button"
                        onClick={() => openReplacePicker(index)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 backdrop-blur-sm py-1.5 text-xs font-bold text-forest-evergreen shadow-sm transition hover:bg-white"
                      >
                        <Camera size={12} />
                        Replace Photo
                      </button>
                    </div>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex min-h-[128px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-forest-moss/30 bg-white/50 text-forest-moss transition-all duration-300 hover:border-forest-evergreen hover:bg-white hover:text-forest-evergreen group"
                  >
                    <div className="rounded-full bg-forest-moss/10 p-3 group-hover:bg-forest-evergreen group-hover:text-white transition-colors duration-300 mb-2">
                      <Plus size={24} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">Add Photo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-forest-evergreen/5 border border-forest-evergreen/10 px-4 py-3 text-sm text-forest-evergreen">
              <MapPin size={18} className="shrink-0 text-forest-moss" />
              <span className="font-medium">
                {geoLoading ? 'Triangulating position via GPS...' : 'GPS Coordinates will be attached to report.'}
              </span>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-forest-light/10 bg-white/50 backdrop-blur-sm px-6 py-5 rounded-b-[2.5rem]">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose?.();
                }}
                className="px-6 py-2.5 rounded-full font-bold text-forest-moss hover:text-forest-deep hover:bg-forest-light/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-nature min-w-[140px]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'File Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIssueModal;
