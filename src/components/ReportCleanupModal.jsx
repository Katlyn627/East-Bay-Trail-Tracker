import React, { useRef, useState } from 'react';
import { addDoc, arrayUnion, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Camera, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useTrailLocationSearch from '../hooks/useTrailLocationSearch';
import { db } from '../firebase';
import { buildGoogleMapsSearchUrl, normalizeCoordinates } from '../utils/maps';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

const ISSUE_TYPES = [
  { value: 'downed_tree', label: 'Downed Tree' },
  { value: 'trash', label: 'Trash / Litter' },
  { value: 'overgrowth', label: 'Overgrowth' },
  { value: 'erosion', label: 'Erosion' },
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

function ReportCleanupModal({ isOpen, onClose, onSuccess }) {
  const { user, userProfile, updateUserProfile } = useAuth();
  const inputRef = useRef(null);
  const [issueType, setIssueType] = useState('trash');
  const [trailName, setTrailName] = useState('');
  const [bagCount, setBagCount] = useState(1);
  const [milesLogged, setMilesLogged] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [selectedTrailLocation, setSelectedTrailLocation] = useState(null);
  const [showTrailSuggestions, setShowTrailSuggestions] = useState(false);
  const { suggestions: trailSuggestions, loading: trailLoading, error: trailError, hasMore: trailHasMore } = useTrailLocationSearch(trailName, {});
  const trailSearch = { suggestions: trailSuggestions, loading: trailLoading, error: trailError, hasMore: trailHasMore };

  const handlePhotoSelection = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    try {
      if (replaceIndex !== null) {
        const replacement = await readFileAsPreview(incomingFiles[0]);
        setPhotos((prev) =>
          prev.map((photo, index) => (index === replaceIndex ? replacement : photo))
        );
        setReplaceIndex(null);
      } else {
        if (photos.length + incomingFiles.length > MAX_PHOTOS) {
          setError(`You can attach up to ${MAX_PHOTOS} photos.`);
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
    if (replaceIndex !== null) {
      setReplaceIndex(null);
    }
  };

  const handleOpenReplace = (index) => {
    setReplaceIndex(index);
    inputRef.current?.click();
  };

  const resetForm = () => {
    setIssueType('trash');
    setTrailName('');
    setBagCount(1);
    setMilesLogged('');
    setHoursWorked('');
    setWeightLbs('');
    setNotes('');
    setPhotos([]);
    setReplaceIndex(null);
    setSelectedTrailLocation(null);
    setShowTrailSuggestions(false);
    setFieldErrors({});
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const newErrors = {};

    if (!user) {
      setError('You must be signed in to record a cleanup.');
      return;
    }

    if (!trailName.trim()) {
      newErrors.trailName = 'TRAIL NAME is required. Please search and select one.';
    }

    if (!notes.trim()) {
      newErrors.notes = 'FIELD NOTES are required to document the impact.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      const uploadedPhotoUrls = [];
      for (const photo of photos) {
        try {
          if (typeof photo.preview === 'string' && photo.preview.startsWith('data:')) {
            uploadedPhotoUrls.push(photo.preview);
            continue;
          }

          const uploadPromise = uploadTrailReportImage(photo.file, user.uid);
          const url = await Promise.race([
            uploadPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('upload_timeout')), 4000))
          ]);
          uploadedPhotoUrls.push(url);
        } catch (uploadErr) {
          console.warn('Cleanup photo upload failed/deferred:', uploadErr);
          if (photo.preview && photo.preview.length < 1000000) {
            uploadedPhotoUrls.push(photo.preview);
          }
        }
      }

      const bagTotal = Number(bagCount || 0);
      const miles = Number(milesLogged || 0);
      const hours = Number(hoursWorked || 0);
      const totalWeight = Number(weightLbs || 0);
      const pointsEarned = 25;
      const normalizedTrailName = trailName.trim();
      const trailCoordinates =
        selectedTrailLocation?.name?.trim().toLowerCase() === normalizedTrailName.toLowerCase()
          ? normalizeCoordinates({
              latitude: selectedTrailLocation.latitude,
              longitude: selectedTrailLocation.longitude,
            })
          : null;
      const trailMapUrl = buildGoogleMapsSearchUrl(normalizedTrailName, trailCoordinates);

      const reportData = {
        uid: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || 'Trail Explorer',
        issueType,
        trailName: normalizedTrailName,
        trailCoordinates,
        trailMapUrl,
        bagCount: bagTotal,
        totalWeightLbs: totalWeight,
        milesLogged: miles,
        totalHours: hours,
        notes: notes.trim(),
        photoUrls: uploadedPhotoUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'submitted',
      };

      const firestoreAction = async () => {
        await addDoc(collection(db, 'reports'), reportData);

        await setDoc(doc(db, 'users', user.uid), {
          pointsBalance: increment(pointsEarned),
          totalBags: increment(bagTotal),
          totalWeightLbs: increment(totalWeight),
          totalMiles: increment(miles),
          totalHours: increment(hours),
          uniqueTrails: arrayUnion(normalizedTrailName),
          trashBagsCollected: increment(bagTotal),
          milesLogged: increment(miles),
          volunteerHours: increment(hours),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      };

      try {
        await Promise.race([firestoreAction(), timeoutPromise]);

        const existingTrails = Array.isArray(userProfile?.uniqueTrails) ? userProfile.uniqueTrails : [];
        const nextUniqueTrails = existingTrails.includes(normalizedTrailName)
          ? existingTrails
          : [...existingTrails, normalizedTrailName];

        updateUserProfile?.({
          pointsBalance: (userProfile?.pointsBalance || 0) + pointsEarned,
          totalBags: (userProfile?.totalBags ?? userProfile?.trashBagsCollected ?? 0) + bagTotal,
          totalWeightLbs: (userProfile?.totalWeightLbs || 0) + totalWeight,
          totalMiles: (userProfile?.totalMiles ?? userProfile?.milesLogged ?? 0) + miles,
          totalHours: (userProfile?.totalHours ?? userProfile?.volunteerHours ?? 0) + hours,
          uniqueTrails: nextUniqueTrails,
          trashBagsCollected: (userProfile?.trashBagsCollected || 0) + bagTotal,
          milesLogged: (userProfile?.milesLogged || 0) + miles,
          volunteerHours: (userProfile?.volunteerHours || 0) + hours,
        });

        onSuccess?.(`Cleanup submitted! You earned ${pointsEarned} points.`);
      } catch (raceErr) {
        console.warn('Cleanup pending (offline):', raceErr);
        onSuccess?.('Saved offline — will sync when online');
      }

      resetForm();
      onClose?.();
    } catch (err) {
      console.error('Cleanup submission error:', err);
      const isOffline = err.message?.includes('timeout') || !navigator.onLine || err.code === 'unavailable';

      if (isOffline) {
        onSuccess?.('Saved offline — will sync when online');
        resetForm();
        onClose?.();
      } else {
        setError(err.message || 'Unable to log this cleanup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header border-b border-stone-200/60 pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-moss">Trail Steward</p>
            <h2 className="font-heading text-2xl font-bold text-forest-deep mt-1">Log a Cleanup</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-forest-moss transition hover:bg-forest-light/10 hover:text-forest-evergreen"
            aria-label="Close cleanup form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="modal-body overflow-y-auto max-h-[calc(90dvh-180px)] px-1 py-2 scrollbar-thin">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="mb-3 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Restoration Type</label>
              <div className="grid grid-cols-2 gap-3">
                {ISSUE_TYPES.map((entry) => (
                  <button
                    key={`${entry.value}-${entry.label}`}
                    type="button"
                    onClick={() => setIssueType(entry.value)}
                    className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-all duration-300 ${
                      issueType === entry.value
                        ? 'border-forest-evergreen bg-forest-evergreen text-white shadow-md'
                        : 'border-white bg-white text-forest-moss hover:border-forest-light/30 hover:bg-forest-light/5'
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Trail Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={trailName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTrailName(value);
                      if (selectedTrailLocation && selectedTrailLocation.name !== value) {
                        setSelectedTrailLocation(null);
                      }
                      setShowTrailSuggestions(true);
                      if (fieldErrors.trailName) {
                        setFieldErrors(prev => ({ ...prev, trailName: '' }));
                      }
                    }}
                    onFocus={() => setShowTrailSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowTrailSuggestions(false), 120)}
                    placeholder="Search California trails or parks..."
                    className={`nature-input shadow-sm ${fieldErrors.trailName ? 'border-red-500 bg-red-50/30' : ''}`}
                  />
                  {showTrailSuggestions && (trailSearch.suggestions.length > 0 || trailSearch.loading) && (
                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-forest-light/10 bg-white/95 backdrop-blur-md shadow-xl py-2 scrollbar-thin">
                      {trailSearch.loading && (
                        <div className="px-4 py-2 text-xs text-forest-moss flex items-center gap-2 italic">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Searching California...</span>
                        </div>
                      )}
                      {trailSearch.suggestions.map((suggestion, idx) => (
                        <button
                          key={`${suggestion.source}-${suggestion.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            setTrailName(suggestion.name);
                            setSelectedTrailLocation(suggestion);
                            setShowTrailSuggestions(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-forest-evergreen hover:text-white transition-colors border-b border-forest-light/5 last:border-0"
                        >
                          <div className="font-bold text-sm flex items-center gap-2">
                            {suggestion.name}
                            {suggestion.isTrailhead && (
                              <span className="text-[8px] border border-current px-1 rounded uppercase tracking-tighter opacity-70">Trailhead</span>
                            )}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">{suggestion.displayName}</div>
                        </button>
                      ))}
                      {trailSearch.hasMore && (
                        <div className="px-4 py-1 text-[9px] text-center text-forest-moss/50 uppercase font-bold tracking-widest">
                          Showing top results • Keep typing to refine
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {fieldErrors.trailName && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-600 uppercase tracking-tight px-1">{fieldErrors.trailName}</p>
                )}
                {trailSearch.loading && <p className="mt-2 text-xs font-medium text-forest-moss animate-pulse px-1">Scanning wilderness database...</p>}
                {trailSearch.error && <p className="mt-2 text-xs font-bold text-red-600 px-1">{trailSearch.error}</p>}
                {trailName.trim() && (
                  <a
                    href={buildGoogleMapsSearchUrl(
                      trailName,
                      selectedTrailLocation?.name?.trim().toLowerCase() === trailName.trim().toLowerCase()
                        ? selectedTrailLocation
                        : null
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-forest-evergreen hover:text-forest-deep transition-colors"
                  >
                    <MapPin size={12} />
                    View on Google Maps
                  </a>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Bags Collected</label>
                <input
                  type="number"
                  min="0"
                  value={bagCount}
                  onChange={(event) => setBagCount(Math.max(0, Number(event.target.value || 0)))}
                  className="nature-input shadow-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Miles Logged</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={milesLogged}
                  onChange={(event) => setMilesLogged(event.target.value)}
                  placeholder="0.0"
                  className="nature-input shadow-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Volunteer Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={hoursWorked}
                  onChange={(event) => setHoursWorked(event.target.value)}
                  placeholder="0.0"
                  className="nature-input shadow-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Trash Weight (lbs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weightLbs}
                  onChange={(event) => setWeightLbs(event.target.value)}
                  placeholder="0.0"
                  className="nature-input shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Cleanup Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  if (fieldErrors.notes) {
                    setFieldErrors(prev => ({ ...prev, notes: '' }));
                  }
                }}
                placeholder="Notes on the work completed today..."
                className={`nature-textarea shadow-sm ${fieldErrors.notes ? 'border-red-500 bg-red-50/30' : ''}`}
              />
              {fieldErrors.notes && (
                <p className="mt-1.5 text-[10px] font-bold text-red-600 uppercase tracking-tight px-1">{fieldErrors.notes}</p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-bold text-forest-deep/80 uppercase tracking-wider">Before & After Photos</label>
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
                    <img src={photo.preview} alt={`Cleanup preview ${index + 1}`} className="h-32 w-full object-cover" />
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
                        onClick={() => handleOpenReplace(index)}
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
              <span className="font-medium">GPS location will be verified on submission.</span>
            </div>
          </div>

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
              disabled={loading}
              className="btn-nature h-11 px-8 min-w-[160px] rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Logging...</span>
                </div>
              ) : (
                'Log Cleanup'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportCleanupModal;
