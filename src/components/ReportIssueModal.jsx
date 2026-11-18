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
  const [fieldErrors, setFieldErrors] = useState({});
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
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
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
    setFieldErrors({});
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const newErrors = {};

    if (!user) {
      setError('You must be signed in before reporting a trail issue.');
      return;
    }

    if (!formData.trailName.trim()) {
      newErrors.trailName = 'TRAIL NAME is required. Please search and select one.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'DESCRIPTION & DETAILS are required.';
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required. Try re-searching for the trail.');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);

    // Create a 5-second timeout promise to handle offline/slow network
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );

    try {
      const photoURLs = [];
      for (const photo of photos) {
        try {
          if (typeof photo.preview === 'string' && photo.preview.startsWith('data:')) {
            photoURLs.push(photo.preview);
            continue;
          }
          const uploadPromise = uploadTrailReportImage(photo.file, user.uid);
          const url = await Promise.race([
            uploadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('upload_timeout')), 4000))
          ]);
          photoURLs.push(url);
        } catch (uploadErr) {
          console.warn('Photo upload deferred:', uploadErr);
          if (photo.preview && photo.preview.length < 1000000) {
            photoURLs.push(photo.preview);
          }
        }
      }

      const reportData = {
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
      };

      const firestoreAction = async () => {
        await addDoc(collection(db, 'trailReports'), reportData);
        await setDoc(doc(db, 'users', user.uid), {
          pointsBalance: increment(50),
          issuesReported: increment(1),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      };

      try {
        await Promise.race([firestoreAction(), timeoutPromise]);

        updateUserProfile?.({
          pointsBalance: (userProfile?.pointsBalance || 0) + 50,
          issuesReported: (userProfile?.issuesReported || 0) + 1,
        });

        onSuccess?.('Issue reported! You earned 50 points.');
        resetForm();
        onClose?.();
      } catch (raceErr) {
        console.warn('Submission pending (offline):', raceErr);
        onSuccess?.('Saved offline — will sync when online');
        resetForm();
        onClose?.();
      }
    } catch (err) {
      console.error('Report submission error:', err);
      const isOffline = err.message?.includes('timeout') || !navigator.onLine || err.code === 'unavailable';

      if (isOffline) {
        onSuccess?.('Saved offline — will sync when online');
        resetForm();
        onClose?.();
      } else {
        setError(err.message || 'Failed to submit report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <div className="modal-header border-b border-stone-200/60 pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-moss">Guardian Action</p>
            <h2 className="font-heading text-2xl font-bold text-forest-deep mt-1">Report a Trail Issue</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-forest-moss transition hover:bg-forest-light/10 hover:text-forest-evergreen"
            aria-label="Close report issue modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-body overflow-y-auto max-h-[calc(90dvh-180px)] px-1 scrollbar-thin">
          <form id="report-issue-form" onSubmit={handleSubmit} className="space-y-6 py-2">
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
                    key={`${entry.value}-${entry.label}`}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, issueType: entry.value }))}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-2 py-3 text-sm font-bold transition-all duration-300 ${
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
                      rel="noopener noreferrer"
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
                    className={`nature-input pr-10 ${fieldErrors.trailName ? 'border-red-500 bg-red-50/30' : ''}`}
                    autoComplete="off"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-moss/50" />
                </div>
                {fieldErrors.trailName && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-600 uppercase tracking-tight">{fieldErrors.trailName}</p>
                )}

                {showSuggestions && (trailSearch.suggestions.length > 0 || trailSearch.loading) && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-forest-light/10 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin">
                    {trailSearch.loading && (
                      <div className="px-4 py-3 text-sm text-forest-moss flex items-center gap-2 bg-sage-mist/10">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Searching California trailheads...</span>
                      </div>
                    )}
                    {trailSearch.suggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.source}-${suggestion.id}-${idx}`}
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
                          </div>
                          <div className="text-[10px] text-forest-moss/70 font-medium truncate">
                            {suggestion.displayName.includes(',')
                              ? suggestion.displayName.split(',').slice(1).join(',').trim()
                              : suggestion.displayName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Description & Details</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the issue, location markers, and urgency..."
                className={`nature-textarea ${fieldErrors.description ? 'border-red-500 bg-red-50/30' : ''}`}
              />
              {fieldErrors.description && (
                <p className="mt-1.5 text-[10px] font-bold text-red-600 uppercase tracking-tight">{fieldErrors.description}</p>
              )}
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
                  className="nature-input"
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
                  className="nature-input"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Priority Level</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="nature-input appearance-none cursor-pointer"
              >
                <option value="low">Low Priority (Maintenance needed)</option>
                <option value="medium">Medium Priority (Action recommended)</option>
                <option value="high">High Priority (Safety hazard)</option>
              </select>
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
                  <div key={photo.id} className="group relative overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm transition-all hover:shadow-md">
                    <img src={photo.preview} alt={`Issue preview ${index + 1}`} className="h-32 w-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="rounded-full bg-red-500/90 p-2 text-white shadow-lg transition hover:bg-red-600 active:scale-90"
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
                        Replace
                      </button>
                    </div>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex min-h-[128px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-forest-moss/30 bg-white/50 text-forest-moss transition-all duration-300 hover:border-forest-evergreen hover:bg-white hover:text-forest-evergreen group"
                  >
                    <Plus size={24} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wide">Add Photo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-forest-evergreen/5 border border-forest-evergreen/10 px-4 py-3 text-sm text-forest-evergreen">
              <MapPin size={18} className="shrink-0 text-forest-moss" />
              <span className="font-medium text-xs">
                {geoLoading ? 'Triangulating position via GPS...' : 'GPS Coordinates will be attached to report.'}
              </span>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="modal-footer border-t border-stone-200/60 pt-5 mt-auto">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="h-11 px-8 rounded-xl font-bold text-forest-moss hover:text-forest-deep hover:bg-forest-light/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="report-issue-form"
            disabled={loading}
            className="btn-nature h-11 px-8 min-w-[160px] rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              'File Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportIssueModal;
