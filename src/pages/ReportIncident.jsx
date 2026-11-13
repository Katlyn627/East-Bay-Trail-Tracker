import React, { useEffect, useState } from 'react';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, Crosshair, Loader2, MapPin, UploadCloud, X, Trees, AlertCircle, ShieldAlert } from 'lucide-react';
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
  { value: 'low', label: 'Low - Passable' },
  { value: 'medium', label: 'Medium - Caution' },
  { value: 'urgent', label: 'Urgent - Blocked' },
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
        setError('Unable to capture location. Please allow location permission.');
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
      setError('You must be signed in to report an incident.');
      return;
    }

    if (!formData.trailName.trim()) {
      setError('Please provide the trail name.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please capture coordinates first.');
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
      setSuccess(`Report submitted! +${pointsEarned} maintenance points awarded.`);
    } catch (submitError) {
      console.error('Submission error:', submitError);
      setError(submitError.message || 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="organic-card bg-poppy-gradient p-6 mb-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold mb-4">
            <ShieldAlert size={14} />
            MAINTENANCE ALERT
          </div>
          <h2 className="text-3xl font-heading font-black">Report a Hazard</h2>
          <p className="text-white/90 text-sm mt-2 max-w-xl font-medium">
            Help us keep California's trails safe. Your report will be shared with the community and local maintenance crews.
          </p>
        </div>
        <div className="absolute right-[-10px] bottom-[-20px] opacity-20 pointer-events-none transform -rotate-12">
          <AlertCircle size={180} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="organic-card p-6 bg-white/90 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trail Name */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <MapPin size={16} className="text-poppy" />
              Trail / Park Name
            </label>
            <input
              type="text"
              value={formData.trailName}
              onChange={(event) => handleChange('trailName', event.target.value)}
              placeholder="e.g. Redwood Regional, Tilden Park..."
              className="nature-input"
              required
            />
          </div>

          {/* Category & Severity */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Trees size={16} className="text-forest" />
              Hazard Category
            </label>
            <select
              value={formData.category}
              onChange={(event) => handleChange('category', event.target.value)}
              className="nature-input appearance-none bg-white"
            >
              {INCIDENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <AlertTriangle size={16} className="text-poppy" />
              Severity Level
            </label>
            <select
              value={formData.severity}
              onChange={(event) => handleChange('severity', event.target.value)}
              className="nature-input appearance-none bg-white"
            >
              {SEVERITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Capture */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-sage-mist/50 border-2 border-forest-moss/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-forest/10 rounded-lg text-forest">
                   <Crosshair size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-forest-deep">GPS Location</p>
                  <p className="text-xs text-forest-moss font-medium">Pinpoint the exact location of the issue.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={captureLocation}
                disabled={geoLoading}
                className="btn-poppy text-xs py-2 px-4 flex items-center gap-2 whitespace-nowrap"
              >
                {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                {geoLoading ? 'Capturing...' : 'Recapture GPS'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-forest-moss/10">
                <span className="text-[10px] font-bold text-forest-moss block uppercase tracking-tighter mb-1">Latitude</span>
                <code className="text-sm font-bold text-forest-deep">{formData.latitude || '--.------'}</code>
              </div>
              <div className="bg-white rounded-xl p-3 border border-forest-moss/10">
                <span className="text-[10px] font-bold text-forest-moss block uppercase tracking-tighter mb-1">Longitude</span>
                <code className="text-sm font-bold text-forest-deep">{formData.longitude || '--.------'}</code>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-forest-deep ml-1">Issue Details</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Describe the hazard and any safety concerns..."
              className="nature-input min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Photos */}
          <div className="md:col-span-2 space-y-2">
             <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <UploadCloud size={16} className="text-forest" />
              Attach Evidence
            </label>
            <div className="relative group">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="nature-input border-dashed border-2 flex flex-col items-center justify-center py-8 group-hover:bg-sage-mist/50 transition-colors">
                <UploadCloud size={32} className="text-forest-moss mb-2" />
                <p className="text-sm font-bold text-forest-deep">Tap to add photos</p>
                <p className="text-xs text-forest-moss mt-1">Up to {MAX_PHOTOS} photos allowed</p>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {photos.map((photo, index) => (
                  <div key={`${photo.name}-${index}`} className="relative rounded-2xl overflow-hidden aspect-square border-2 border-sage-mist shadow-sm">
                    <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-poppy transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-100 text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-forest/10 border-2 border-forest/20 text-forest-deep text-sm font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-forest" />
            {success}
          </div>
        )}

        <div className="pt-6 border-t border-forest-moss/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-forest-moss">
             <Star className="text-gold" size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Earn 50 Maintenance Points</span>
          </div>
          <button
            type="submit"
            disabled={submitting || geoLoading}
            className="btn-poppy w-full sm:w-auto min-w-[200px] py-4 flex items-center justify-center gap-2 text-white shadow-poppy/20"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Send Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const Star = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

export default ReportIncident;
