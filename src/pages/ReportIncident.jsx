import React, { useEffect, useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, Crosshair, Loader2, MapPin, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

const INCIDENT_CATEGORIES = [
  { value: 'downed_tree', label: 'Downed Tree' },
  { value: 'trail_erosion', label: 'Trail Erosion' },
  { value: 'overgrowth', label: 'Overgrowth' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'urgent', label: 'Urgent' },
];

const MAX_PHOTOS = 5;

const ReportIncident = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    trailName: '',
    category: 'downed_tree',
    severity: 'medium',
    latitude: '',
    longitude: '',
    description: '',
  });
  const [photos, setPhotos] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setError('');
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
      (geoError) => {
        console.warn('Geolocation error:', geoError);
        setGeoLoading(false);
        setError('Unable to capture location. Please allow location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  useEffect(() => {
    captureLocation();
  }, []);

  const handleChange = (field, value) => {
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
    setFormData((prev) => ({
      ...prev,
      trailName: '',
      category: 'downed_tree',
      severity: 'medium',
      description: '',
    }));
    setPhotos([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be signed in before reporting an incident.');
      return;
    }

    if (!formData.trailName.trim()) {
      setError('Please provide the trail name.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description of the incident.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please capture coordinates before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const pointsEarned = 50;
      const uploadedPhotoUrls = [];

      for (const photo of photos) {
        const photoUrl = await uploadTrailReportImage(photo, user.uid);
        uploadedPhotoUrls.push(photoUrl);
      }

      await addDoc(collection(db, 'trailReports'), {
        uid: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.displayName || 'Trail Explorer',
        trailName: formData.trailName.trim(),
        incidentCategory: formData.category,
        severity: formData.severity,
        description: formData.description.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        photoURLs: uploadedPhotoUrls,
        status: 'reported',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        pointsBalance: increment(pointsEarned),
        issuesReported: increment(1),
        updatedAt: serverTimestamp(),
      });

      await updateUserProfile({
        pointsBalance: (userProfile?.pointsBalance || 0) + pointsEarned,
        issuesReported: (userProfile?.issuesReported || 0) + 1,
      });

      resetForm();
      setSuccess(`Incident submitted successfully. +${pointsEarned} maintenance points awarded.`);
    } catch (submitError) {
      console.error('Incident submission error:', submitError);
      setError(submitError.message || 'Unable to submit this incident right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="organic-card brand-card brand-glass-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">Trail Safety</p>
        <h2 className="mt-2 text-2xl font-bold text-[#1B4332] sm:text-3xl">Report Incident</h2>
        <p className="mt-2 text-sm text-[#1B4332]/75">
          File a hazard report so trail teams can prioritize maintenance response.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="organic-card brand-card brand-glass-panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Trail Name</span>
            <input
              type="text"
              value={formData.trailName}
              onChange={(event) => handleChange('trailName', event.target.value)}
              placeholder="Redwood Regional"
              className="input-field"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Incident Category</span>
            <select
              value={formData.category}
              onChange={(event) => handleChange('category', event.target.value)}
              className="input-field"
            >
              {INCIDENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Severity / Priority</span>
            <select
              value={formData.severity}
              onChange={(event) => handleChange('severity', event.target.value)}
              className="input-field"
            >
              {SEVERITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-[#52B788]/30 bg-[#f2fbf6] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">GPS Coordinates</p>
                <p className="text-xs text-[#1B4332]/70">
                  Auto-captured from your device. You can recapture if needed.
                </p>
              </div>
              <button
                type="button"
                onClick={captureLocation}
                className="inline-flex items-center gap-1 rounded-md border border-[#52B788]/50 bg-white px-2 py-1 text-xs font-semibold text-[#1B4332] transition hover:bg-[#ecf9f1]"
              >
                <Crosshair size={13} />
                {geoLoading ? 'Capturing...' : 'Recapture'}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-white px-2 py-1.5 text-xs text-[#1B4332]">
                <span className="font-semibold">Lat:</span> {formData.latitude || 'Not captured'}
              </div>
              <div className="rounded-md bg-white px-2 py-1.5 text-xs text-[#1B4332]">
                <span className="font-semibold">Lng:</span> {formData.longitude || 'Not captured'}
              </div>
            </div>
          </div>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Description</span>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Describe what you observed, exact location markers, and immediate safety concerns."
              className="input-field"
              required
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#1B4332]">Photo Attachments</span>
            <div className="rounded-xl border border-dashed border-[#52B788]/45 bg-[#f4faf7] p-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#1B4332] transition hover:bg-[#43a676]">
                <UploadCloud size={16} />
                Add photos
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
                  <MapPin size={14} className="text-[#1B4332]" />
                  <span className="max-w-[220px] truncate text-sm text-[#1B4332]">{photo.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="rounded-md p-1 text-[#8b6a4f] transition hover:bg-[#f7ece0] hover:text-[#1B4332]"
                  aria-label={`Remove ${photo.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#52B788]/40 bg-[#ecf9f1] px-3 py-2 text-sm text-[#1B4332]">
            <CheckCircle2 size={16} className="text-[#52B788]" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D4A373]/25 pt-4">
          <p className="text-xs text-[#1B4332]/70">Submitting this report awards +50 maintenance points.</p>
          <button
            type="submit"
            disabled={submitting || geoLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22523f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Incident'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIncident;
