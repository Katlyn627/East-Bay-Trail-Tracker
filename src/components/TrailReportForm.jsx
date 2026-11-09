import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
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
    <div className="min-h-screen bg-gradient-to-br from-eco-50 to-eco-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-eco-900 mb-2">
            Report Trail Issue
          </h1>
          <p className="text-eco-700">
            Help us keep trails safe and well-maintained
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold">Report submitted!</p>
              <p className="text-green-700 text-sm">
                You earned 50 points for reporting this issue.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
        >
          {/* Issue Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-eco-900 mb-4">
              What type of issue? <span className="text-red-500">*</span>
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
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.issueType === type.value
                      ? 'border-eco-600 bg-eco-50'
                      : 'border-gray-200 bg-gray-50 hover:border-eco-400'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium text-center">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trail Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-eco-900 mb-2">
              Trail Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="trailName"
              value={formData.trailName}
              onChange={handleInputChange}
              placeholder="e.g., Mission Peak Trail, Sunol Regional Wilderness"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-500"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-eco-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-500 resize-none"
            />
          </div>

          {/* Severity */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-eco-900 mb-2">
              Severity Level
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-500"
            >
              <option value="low">Low - Minor concern</option>
              <option value="medium">Medium - Should address soon</option>
              <option value="high">High - Safety concern</option>
            </select>
          </div>

          {/* Location */}
          <div className="mb-6 p-4 bg-eco-50 rounded-lg border border-eco-200">
            <label className="flex items-center gap-2 text-sm font-semibold text-eco-900 mb-3">
              <MapPin className="w-4 h-4" />
              Location <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-eco-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="0.000000"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
                />
              </div>
              <div>
                <label className="block text-xs text-eco-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="0.000000"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
                />
              </div>
            </div>
            {geoLoading && (
              <p className="text-xs text-eco-600 mt-2">
                Detecting your location...
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-eco-900 mb-3">
              <Camera className="w-4 h-4 inline-block mr-2" />
              Add Photos (up to 5)
            </label>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Input */}
            <label className="block">
              <div className="border-2 border-dashed border-eco-300 rounded-lg p-6 text-center cursor-pointer hover:border-eco-500 transition-colors">
                <Camera className="w-8 h-8 text-eco-600 mx-auto mb-2" />
                <p className="text-sm text-eco-700 font-medium">
                  Click to upload or drag photos
                </p>
                <p className="text-xs text-eco-600 mt-1">
                  PNG, JPG up to 10MB each
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
            className="w-full bg-gradient-to-r from-eco-600 to-eco-700 text-white font-bold py-3 px-4 rounded-lg hover:from-eco-700 hover:to-eco-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
