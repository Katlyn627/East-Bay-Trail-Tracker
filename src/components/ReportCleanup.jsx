import React, { useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Camera, ImagePlus, Loader2, MapPin, Trash2, Trees } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

const ISSUE_TYPES = [
  { value: 'downed_tree', label: 'Downed Tree' },
  { value: 'trash', label: 'Trash / Litter' },
  { value: 'overgrowth', label: 'Overgrowth' },
  { value: 'erosion', label: 'Erosion' },
];

function ReportCleanup() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [issueType, setIssueType] = useState('trash');
  const [bagCount, setBagCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setSelectedPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be signed in to log a cleanup.');
      return;
    }

    if (!notes.trim()) {
      setError('Please add a quick note about the cleanup work you completed.');
      return;
    }

    try {
      setLoading(true);
      let photoUrl = '';

      if (photoFile) {
        photoUrl = await uploadTrailReportImage(photoFile, user.uid);
      }

      const pointsEarned = 25 + Number(bagCount || 0) * 10;
      const saplingsAwarded = Math.max(1, Math.ceil((Number(bagCount) || 0) / 3));

      const reportDoc = {
        uid: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || 'Trail Explorer',
        issueType,
        bagCount: Number(bagCount || 0),
        notes: notes.trim(),
        photoUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'submitted',
      };

      await addDoc(collection(db, 'reports'), reportDoc);

      const currentSaplings = Number(userProfile?.saplings ?? userProfile?.saplingsAvailable ?? userProfile?.seeds ?? 0) || 0;

      await updateDoc(doc(db, 'users', user.uid), {
        pointsBalance: increment(pointsEarned),
        trashBagsCollected: increment(Number(bagCount || 0)),
        saplings: increment(saplingsAwarded),
        saplingsAvailable: increment(saplingsAwarded),
        seeds: increment(saplingsAwarded),
        updatedAt: serverTimestamp(),
      });

      const nextProfile = {
        ...userProfile,
        pointsBalance: (userProfile?.pointsBalance || 0) + pointsEarned,
        trashBagsCollected: (userProfile?.trashBagsCollected || 0) + Number(bagCount || 0),
        saplings: currentSaplings + saplingsAwarded,
        saplingsAvailable: currentSaplings + saplingsAwarded,
        seeds: currentSaplings + saplingsAwarded,
      };

      await updateUserProfile({
        pointsBalance: nextProfile.pointsBalance,
        trashBagsCollected: nextProfile.trashBagsCollected,
        saplings: nextProfile.saplings,
        saplingsAvailable: nextProfile.saplingsAvailable,
        seeds: nextProfile.seeds,
      });

      setSuccess(`Cleanup submitted! You earned ${pointsEarned} points and ${saplingsAwarded} sapling${saplingsAwarded > 1 ? 's' : ''}.`);
      setIssueType('trash');
      setBagCount(1);
      setNotes('');
      setSelectedPhoto(null);
      setPhotoFile(null);
      if (document.getElementById('cleanup-photo-input')) {
        document.getElementById('cleanup-photo-input').value = '';
      }
    } catch (err) {
      console.error('Cleanup submission error:', err);
      setError(err.message || 'Unable to log this cleanup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          <Trees size={16} />
          Trail cleanup log
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Log a cleanup</h1>
        <p className="mt-2 text-sm text-slate-600">Track community impact, upload a photo, and grow your virtual forest.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
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

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} className="text-emerald-600" />
              Location from device
            </div>
            <p className="mt-2 text-sm text-slate-500">Use your current trail position when available.</p>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Cleanup notes</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Cleared litter near the creek, trimmed back overgrowth near the south ridge, and removed a fallen branch."
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Camera size={16} className="text-emerald-600" />
            Upload cleanup photo
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-emerald-400">
            <ImagePlus size={28} className="mb-2 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">Choose a photo</span>
            <input id="cleanup-photo-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoSelection} className="hidden" />
          </label>

          {selectedPhoto && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <img src={selectedPhoto} alt="Cleanup preview" className="h-48 w-full object-cover" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Saving cleanup...
            </span>
          ) : (
            'Submit cleanup'
          )}
        </button>
      </form>
    </div>
  );
}

export default ReportCleanup;
