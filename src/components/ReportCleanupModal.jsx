import React, { useRef, useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Camera, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
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

function ReportCleanupModal({ isOpen, onClose }) {
  const { user, userProfile, updateUserProfile } = useAuth();
  const inputRef = useRef(null);
  const [issueType, setIssueType] = useState('trash');
  const [bagCount, setBagCount] = useState(1);
  const [milesLogged, setMilesLogged] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setBagCount(1);
    setMilesLogged('');
    setNotes('');
    setPhotos([]);
    setReplaceIndex(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be signed in to record a cleanup.');
      return;
    }

    if (!notes.trim()) {
      setError('Please add a quick note about the cleanup work completed.');
      return;
    }

    try {
      setLoading(true);

      const uploadedPhotoUrls = [];
      for (const photo of photos) {
        const url = await uploadTrailReportImage(photo.file, user.uid);
        uploadedPhotoUrls.push(url);
      }

      const bagTotal = Number(bagCount || 0);
      const miles = Number(milesLogged || 0);
      const pointsEarned = 25 + bagTotal * 10;

      await addDoc(collection(db, 'reports'), {
        uid: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || 'Trail Explorer',
        issueType,
        bagCount: bagTotal,
        milesLogged: miles,
        notes: notes.trim(),
        photoUrls: uploadedPhotoUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'submitted',
      });

      await updateDoc(doc(db, 'users', user.uid), {
        pointsBalance: increment(pointsEarned),
        trashBagsCollected: increment(bagTotal),
        milesLogged: increment(miles),
        updatedAt: serverTimestamp(),
      });

      await updateUserProfile({
        pointsBalance: (userProfile?.pointsBalance || 0) + pointsEarned,
        trashBagsCollected: (userProfile?.trashBagsCollected || 0) + bagTotal,
        milesLogged: (userProfile?.milesLogged || 0) + miles,
      });

      setSuccess(`Cleanup submitted! You earned ${pointsEarned} points.`);
      resetForm();

      setTimeout(() => {
        onClose?.();
      }, 600);
    } catch (err) {
      console.error('Cleanup submission error:', err);
      setError(err.message || 'Unable to log this cleanup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-8 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Trail cleanup</p>
            <h2 className="text-2xl font-bold text-slate-900">Log a cleanup</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose?.();
            }}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close cleanup form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
          )}

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">Issue type</label>
            <div className="grid grid-cols-2 gap-3">
              {ISSUE_TYPES.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setIssueType(entry.value)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    issueType === entry.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Trash bags collected</span>
              <input
                type="number"
                min="0"
                value={bagCount}
                onChange={(event) => setBagCount(Math.max(0, Number(event.target.value || 0)))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Miles logged</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={milesLogged}
                onChange={(event) => setMilesLogged(event.target.value)}
                placeholder="0.5"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cleanup notes</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Cleared litter near the creek, trimmed back overgrowth, and removed a fallen branch."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
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
                  <img src={photo.preview} alt={`Cleanup preview ${index + 1}`} className="h-28 w-full object-cover" />
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
                      onClick={() => handleOpenReplace(index)}
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
              <span>Location from your device will be used when available.</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose?.();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit cleanup'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportCleanupModal;
