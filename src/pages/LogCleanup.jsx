import React, { useMemo, useState } from 'react';
import { addDoc, arrayUnion, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Camera, CheckCircle2, Loader2, Trash2, UploadCloud, Trees, MapPin, Scale, Footprints, Clock, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useCaliforniaTrailSearch from '../hooks/useCaliforniaTrailSearch';
import { db } from '../firebase';
import { buildGoogleMapsSearchUrl, normalizeCoordinates } from '../utils/maps';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';

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
  const [selectedTrailLocation, setSelectedTrailLocation] = useState(null);
  const [showTrailSuggestions, setShowTrailSuggestions] = useState(false);
  const trailSearch = useCaliforniaTrailSearch(formData.trailName);

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
    setSelectedTrailLocation(null);
    setShowTrailSuggestions(false);
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
      const selectedCoordinates =
        selectedTrailLocation?.name?.trim().toLowerCase() === trailName.toLowerCase()
          ? normalizeCoordinates({
              latitude: selectedTrailLocation.latitude,
              longitude: selectedTrailLocation.longitude,
            })
          : null;
      const trailMapUrl = buildGoogleMapsSearchUrl(trailName, selectedCoordinates);

      for (const photo of photos) {
        const photoUrl = await uploadTrailReportImage(photo, user.uid);
        uploadedPhotoUrls.push(photoUrl);
      }

      await addDoc(collection(db, 'reports'), {
        uid: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.displayName || 'Trail Explorer',
        trailName,
        trailCoordinates: selectedCoordinates,
        trailMapUrl,
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
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="organic-card bg-forest-gradient p-6 mb-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sage-mist border border-white/20 text-xs font-bold mb-4">
            <Trash2 size={14} />
            RESTORE OUR TRAILS
          </div>
          <h2 className="text-3xl font-heading font-black">Log Your Cleanup</h2>
          <p className="text-sage-mist/80 text-sm mt-2 max-w-xl">
            Every piece of litter removed protects our local wildlife and ecosystems. Thank you for being a guardian of the East Bay.
          </p>
        </div>
        <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
          <Trees size={180} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="organic-card p-6 bg-white/90 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trail Search */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <MapPin size={16} className="text-poppy" />
              Trail / Park Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.trailName}
                onChange={(event) => {
                  const value = event.target.value;
                  handleFieldChange('trailName', value);
                  if (selectedTrailLocation && selectedTrailLocation.name !== value) {
                    setSelectedTrailLocation(null);
                  }
                  setShowTrailSuggestions(true);
                }}
                onFocus={() => setShowTrailSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowTrailSuggestions(false), 120)}
                placeholder="Search California trails..."
                className="nature-input"
                required
              />
              {showTrailSuggestions && trailSearch.suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-forest-moss/20 bg-white shadow-2xl p-2 animate-in fade-in zoom-in-95">
                  {trailSearch.suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => {
                        handleFieldChange('trailName', suggestion.name);
                        setSelectedTrailLocation(suggestion);
                        setShowTrailSuggestions(false);
                      }}
                      className="flex flex-col w-full px-4 py-3 text-left rounded-xl hover:bg-sage-mist transition-colors"
                    >
                      <span className="font-bold text-forest-deep text-sm">{suggestion.name}</span>
                      <span className="text-xs text-forest-moss">{suggestion.displayName.split(',').slice(1).join(',')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Inputs */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Trash2 size={16} className="text-forest" />
              Bags Collected
            </label>
            <input
              type="number"
              min="1"
              value={formData.bagCount}
              onChange={(event) => handleFieldChange('bagCount', Number(event.target.value || 0))}
              className="nature-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Scale size={16} className="text-forest" />
              Est. Weight (lbs)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.estimatedWeightLbs}
              onChange={(event) => handleFieldChange('estimatedWeightLbs', event.target.value)}
              placeholder="0.0"
              className="nature-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Footprints size={16} className="text-lupine" />
              Miles Hiked
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.milesHiked}
              onChange={(event) => handleFieldChange('milesHiked', event.target.value)}
              placeholder="0.0"
              className="nature-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Clock size={16} className="text-poppy" />
              Volunteer Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.volunteerHours}
              onChange={(event) => handleFieldChange('volunteerHours', event.target.value)}
              placeholder="0.0"
              className="nature-input"
              required
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <FileText size={16} className="text-earth-clay" />
              Field Notes
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(event) => handleFieldChange('notes', event.target.value)}
              placeholder="What did you find? Any specific areas needing attention?"
              className="nature-input min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep ml-1">
              <Camera size={16} className="text-forest" />
              Proof of Impact
            </label>
            <div className="relative group">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="nature-input border-dashed border-2 flex flex-col items-center justify-center py-8 group-hover:bg-sage-mist/50 transition-colors">
                <UploadCloud size={32} className="text-forest-moss mb-2" />
                <p className="text-sm font-bold text-forest-deep">Tap to attach photos</p>
                <p className="text-xs text-forest-moss mt-1">Maximum {MAX_PHOTOS} photos allowed</p>
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
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-100 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-forest/10 border-2 border-forest/20 text-forest-deep text-sm font-bold flex items-center gap-2">
            <CheckCircle2 size={20} className="text-forest" />
            {success}
          </div>
        )}

        <div className="pt-6 border-t border-forest-moss/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-forest-moss">
             <Star className="text-gold" size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Earn 25 Rewards Points</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-nature w-full sm:w-auto min-w-[200px] py-4 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Logging...
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

const Star = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

export default LogCleanup;
