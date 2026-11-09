import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertCircle, Camera, CheckCircle, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

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

function ReportIssueModal({ isOpen, onClose }) {
  const { user, userProfile } = useAuth();
  const inputRef = useRef(null);
  const [formData, setFormData] = useState({
    issueType: 'downed_tree',
    trailName: '',
    description: '',
    latitude: '',
    longitude: '',
    severity: 'medium',
  });
  const [photos, setPhotos] = useState([]);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
        setGeoLoading(false);
      },
      { timeout: 5000 }
    );
  }, [isOpen]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setPhotos([]);
    setReplaceIndex(null);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (!user) {
      setError('You must be signed in before reporting a trail issue.');
      return;
    }

    if (!formData.issueType || !formData.trailName || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please provide location information.');
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

      await updateDoc(doc(db, 'users', user.uid), {
        pointsBalance: increment(50),
        issuesReported: increment(1),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      resetForm();
      window.setTimeout(() => {
        onClose?.();
      }, 900);
    } catch (err) {
      console.error('Report submission error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-3 py-5 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Trail issue</p>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Report a trail issue</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close report issue modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Issue reported! You earned 50 points.</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Issue type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ISSUE_TYPES.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, issueType: entry.value }))}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-medium transition ${
                    formData.issueType === entry.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{entry.icon}</span>
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Trail name</span>
              <input
                type="text"
                name="trailName"
                value={formData.trailName}
                onChange={handleInputChange}
                placeholder="Tilden Regional Park"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="State what the issue is, where it is, and how urgent it seems."
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Latitude</span>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="37.8734"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Longitude</span>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-122.2634"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Priority</span>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-slate-700">Photos</label>
              <span className="text-xs text-slate-500">{photos.length}/{MAX_PHOTOS}</span>
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
                <div key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={photo.preview} alt={`Issue preview ${index + 1}`} className="h-28 w-full object-cover" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-slate-900/35 to-transparent p-2">
                    <span className="rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      Photo {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="rounded-full bg-white/85 p-1 text-slate-700 transition hover:bg-white"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-end p-2">
                    <button
                      type="button"
                      onClick={() => openReplacePicker(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
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
                  className="flex min-h-[136px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Plus size={22} className="mb-2" />
                  <span className="text-sm font-medium">Add photo</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <MapPin size={15} />
              <span>{geoLoading ? 'Locating your trail position...' : 'Your current location will be used when available.'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose?.();
              }}
              className="h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Reporting...
                </>
              ) : (
                'Submit issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportIssueModal;
