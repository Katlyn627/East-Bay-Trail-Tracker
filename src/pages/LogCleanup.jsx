import React, { useMemo, useState } from 'react';
import { addDoc, arrayUnion, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Camera, CheckCircle2, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

const SUGGESTED_TRAILS = ['Tilden Regional Park', 'Redwood Regional', 'Mission Peak', 'Joaquin Miller Park'];
const MAX_PHOTOS = 5;

const LogCleanup = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    trailName: '',
    bagCount: 1,
    estimatedWeightLbs: '',
    milesHiked: '',
    volunteerHours: '',
    notes: '',
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const metricsPreview = useMemo(() => {
    return {
      bags: Number(formData.bagCount || 0),
      weight: Number(formData.estimatedWeightLbs || 0),
      miles: Number(formData.milesHiked || 0),
      hours: Number(formData.volunteerHours || 0),
    };
  }, [formData]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setError('');
    setPhotos((prev) => [...prev, ...files]);
    event.target.value = '';
  };

  const removePhoto = (indexToRemove) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setFormData({
      trailName: '',
      bagCount: 1,
      estimatedWeightLbs: '',
      milesHiked: '',
      volunteerHours: '',
      notes: '',
    });
    setPhotos([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be signed in before logging a cleanup.');
      return;
    }

    const trailName = formData.trailName.trim();
    if (!trailName) {
      setError('Please provide a trail or park name.');
      return;
    }

    if (!formData.notes.trim()) {
      setError('Please provide field notes for the cleanup.');
      return;
    }

    try {
      setSubmitting(true);
      const pointsEarned = 25;
      const uploadedPhotoUrls = [];

      for (const photo of photos) {
        const photoUrl = await uploadTrailReportImage(photo, user.uid);
        uploadedPhotoUrls.push(photoUrl);
      }

      await addDoc(collection(db, 'reports'), {
        uid: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.displayName || 'Trail Explorer',
        trailName,
        bagCount: metricsPreview.bags,
        totalWeightLbs: metricsPreview.weight,
        milesLogged: metricsPreview.miles,
        totalHours: metricsPreview.hours,
        notes: formData.notes.trim(),
        photoUrls: uploadedPhotoUrls,
        type: 'cleanup',
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        pointsBalance: increment(pointsEarned),
        totalBags: increment(metricsPreview.bags),
        totalWeightLbs: increment(metricsPreview.weight),
        totalMiles: increment(metricsPreview.miles),
        totalHours: increment(metricsPreview.hours),
        uniqueTrails: arrayUnion(trailName),
        trashBagsCollected: increment(metricsPreview.bags),
        milesLogged: increment(metricsPreview.miles),
        volunteerHours: increment(metricsPreview.hours),
        updatedAt: serverTimestamp(),
      });

      const existingTrails = Array.isArray(userProfile?.uniqueTrails) ? userProfile.uniqueTrails : [];
      const nextUniqueTrails = existingTrails.includes(trailName)
        ? existingTrails
        : [...existingTrails, trailName];

      await updateUserProfile({
        pointsBalance: (userProfile?.pointsBalance || 0) + pointsEarned,
        totalBags: (userProfile?.totalBags ?? userProfile?.trashBagsCollected ?? 0) + metricsPreview.bags,
        totalWeightLbs: (userProfile?.totalWeightLbs || 0) + metricsPreview.weight,
        totalMiles: (userProfile?.totalMiles ?? userProfile?.milesLogged ?? 0) + metricsPreview.miles,
        totalHours: (userProfile?.totalHours ?? userProfile?.volunteerHours ?? 0) + metricsPreview.hours,
        uniqueTrails: nextUniqueTrails,
        trashBagsCollected: (userProfile?.trashBagsCollected || 0) + metricsPreview.bags,
        milesLogged: (userProfile?.milesLogged || 0) + metricsPreview.miles,
        volunteerHours: (userProfile?.volunteerHours || 0) + metricsPreview.hours,
      });

      resetForm();
      setSuccess(`Cleanup logged successfully. +${pointsEarned} points added to your account.`);
    } catch (submitError) {
      console.error('Cleanup submission error:', submitError);
      setError(submitError.message || 'Unable to submit cleanup right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D4A373]/35 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">Cleanup Operations</p>
        <h2 className="mt-2 text-2xl font-bold text-[#1B4332] sm:text-3xl">Log Cleanup Activity</h2>
        <p className="mt-2 text-sm text-[#1B4332]/75">
          Submit cleanup efforts to update your impact metrics and points in real time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#D4A373]/25 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Trail / Park Name</span>
            <input
              type="text"
              list="trail-name-suggestions"
              value={formData.trailName}
              onChange={(event) => handleFieldChange('trailName', event.target.value)}
              placeholder="Tilden Regional Park"
              className="input-field"
              required
            />
            <datalist id="trail-name-suggestions">
              {SUGGESTED_TRAILS.map((trail) => (
                <option key={trail} value={trail} />
              ))}
            </datalist>
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Trash Bags Collected</span>
            <input
              type="number"
              min="0"
              value={formData.bagCount}
              onChange={(event) => handleFieldChange('bagCount', Number(event.target.value || 0))}
              className="input-field"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Estimated Weight (lbs)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.estimatedWeightLbs}
              onChange={(event) => handleFieldChange('estimatedWeightLbs', event.target.value)}
              placeholder="12.5"
              className="input-field"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Miles Hiked</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.milesHiked}
              onChange={(event) => handleFieldChange('milesHiked', event.target.value)}
              placeholder="2.3"
              className="input-field"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Volunteer Hours</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.volunteerHours}
              onChange={(event) => handleFieldChange('volunteerHours', event.target.value)}
              placeholder="1.5"
              className="input-field"
              required
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Field Notes</span>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(event) => handleFieldChange('notes', event.target.value)}
              placeholder="Describe what was cleaned, conditions, and anything to follow up on."
              className="input-field"
              required
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Photo Upload</span>
            <div className="rounded-xl border border-dashed border-[#52B788]/45 bg-[#f4faf7] p-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#1B4332] transition hover:bg-[#43a676]">
                <UploadCloud size={16} />
                Attach photos
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
              <p className="mt-2 text-xs text-[#1B4332]/70">Up to {MAX_PHOTOS} attachments.</p>
            </div>
          </label>
        </div>

        {photos.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {photos.map((photo, index) => (
              <div key={`${photo.name}-${index}`} className="flex items-center justify-between rounded-lg border border-[#D4A373]/30 bg-[#fffaf5] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Camera size={14} className="text-[#1B4332]" />
                  <span className="max-w-[220px] truncate text-sm text-[#1B4332]">{photo.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="rounded-md p-1 text-[#8b6a4f] transition hover:bg-[#f7ece0] hover:text-[#1B4332]"
                  aria-label={`Remove ${photo.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#52B788]/40 bg-[#ecf9f1] px-3 py-2 text-sm text-[#1B4332]">
            <CheckCircle2 size={16} className="text-[#52B788]" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D4A373]/25 pt-4">
          <p className="text-xs text-[#1B4332]/70">Submitting this entry awards +25 points.</p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22523f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Cleanup'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogCleanup;
