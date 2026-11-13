import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import uploadTrailReportImage from '../utils/uploadTrailReportImage';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import {
  AlertCircle,
  MapPin,
  Camera,
  X,
  Loader,
  CheckCircle,
} from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'downed_tree', label: 'Downed Tree', icon: '🌳' },
  { value: 'overgrowth', label: 'Overgrowth', icon: '🌿' },
  { value: 'trash', label: 'Trash/Litter', icon: '🗑️' },
  { value: 'erosion', label: 'Erosion', icon: '⛰️' },
  { value: 'mudslide', label: 'Mudslide', icon: '🏔️' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

export default function TrailReportForm() {
  const { user, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    issueType: '',
    trailName: '',
    description: '',
    latitude: '',
    longitude: '',
    severity: 'medium',
  });

  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Attempt to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
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
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
      setPhotoFiles((prev) => [...prev, file]);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.issueType || !formData.trailName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please provide location information');
      return;
    }

    setLoading(true);

    try {
      // Upload photos to Firebase Storage
      const photoURLs = [];
      for (const file of photoFiles) {
        const downloadURL = await uploadTrailReportImage(file, user.uid);
        photoURLs.push(downloadURL);
      }

      // Create report document in Firestore
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

      // Award points to user for report
      const pointsEarned = 50;
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        pointsBalance: increment(pointsEarned),
        issuesReported: increment(1),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setFormData({
        issueType: '',
        trailName: '',
        description: '',
        latitude: '',
        longitude: '',
        severity: 'medium',
      });
      setPhotos([]);
      setPhotoFiles([]);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Report submission error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-forest-deep mb-2 font-heading">
            Report Trail Issue
          </h1>
          <p className="text-forest-moss font-medium">
            Help us keep trails safe and well-maintained
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-forest/10 border border-forest/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-forest-deep font-bold">Report submitted!</p>
              <p className="text-forest text-sm font-medium">
                You earned 50 points for reporting this issue.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="organic-card p-6 sm:p-8 space-y-8"
        >
          {/* Issue Type Selection */}
          <div>
            <label className="block text-lg font-heading font-bold text-forest-deep mb-4">
              What type of issue? <span className="text-poppy">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ISSUE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      issueType: type.value,
                    }))
                  }
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.issueType === type.value
                      ? 'border-forest bg-forest/5 shadow-inner'
                      : 'border-sage-mist bg-white hover:border-forest-moss/40'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-forest-deep">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trail Name */}
          <div>
            <label className="block text-sm font-bold text-forest-deep mb-2 uppercase tracking-widest">
              Trail Name <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              name="trailName"
              value={formData.trailName}
              onChange={handleInputChange}
              placeholder="e.g., Mission Peak Trail"
              className="nature-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-forest-deep mb-2 uppercase tracking-widest">
              Description <span className="text-poppy">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail..."
              rows="4"
              className="nature-input resize-none"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-bold text-forest-deep mb-2 uppercase tracking-widest">
              Severity Level
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="nature-input appearance-none bg-no-repeat bg-[right_1rem_center]"
            >
              <option value="low">Low - Minor concern</option>
              <option value="medium">Medium - Should address soon</option>
              <option value="high">High - Safety concern</option>
            </select>
          </div>

          {/* Location */}
          <div className="p-6 bg-sage-mist/50 rounded-[2rem] border border-forest-moss/20">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep mb-4 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-poppy" />
              Location <span className="text-poppy">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-forest-moss mb-1 uppercase tracking-tighter">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="0.000000"
                  step="0.000001"
                  className="nature-input text-sm py-2"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-forest-moss mb-1 uppercase tracking-tighter">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="0.000000"
                  step="0.000001"
                  className="nature-input text-sm py-2"
                />
              </div>
            </div>
            {geoLoading && (
              <p className="text-xs text-forest font-bold mt-3 flex items-center gap-2">
                <Loader size={12} className="animate-spin" />
                Detecting your location...
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold text-forest-deep mb-4 uppercase tracking-widest">
              <Camera className="w-4 h-4 inline-block mr-2 text-forest" />
              Add Photos (up to 5)
            </label>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-2xl border-2 border-sage-mist">
                    <img
                      src={photo}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-poppy text-white rounded-full p-1 shadow-lg transform scale-0 group-hover:scale-100 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Input */}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-forest-moss/30 rounded-[2rem] p-8 text-center bg-white/50 hover:bg-white hover:border-forest transition-all">
                <Camera className="w-10 h-10 text-forest-moss mx-auto mb-3" />
                <p className="text-sm text-forest-deep font-bold">
                  Capture or Upload Photos
                </p>
                <p className="text-xs text-forest-moss mt-1">
                  JPG or PNG • Max 5 files
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-nature py-4 text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
