import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, MapPin, Camera, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, onIncidentCreated, initialLocation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(initialLocation?.lat ? initialLocation.lat.toFixed(6) : '');
  const [longitude, setLongitude] = useState(initialLocation?.lng ? initialLocation.lng.toFixed(6) : '');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng) {
      setLatitude(initialLocation.lat.toFixed(6));
      setLongitude(initialLocation.lng.toFixed(6));
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  // 1. Detect Live GPS using native browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsDetectingLocation(false);
      },
      (err) => {
        console.error('GPS error:', err);
        setError('Unable to detect location. Please enter manually or check location permissions.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 2. Image Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 3. Submit Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !latitude || !longitude) {
      setError('Please fill in title, description, and GPS coordinates.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      if (address) formData.append('address', address);
      if (imageFile) formData.append('image', imageFile);

      const token = localStorage.getItem('token') || '';
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/incidents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.data.success) {
        onIncidentCreated(response.data.incident);
        onClose();
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit incident. Please verify backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm z-[9999]">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg flex-shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">Report Traffic Incident</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">Gemini AI will automatically triage & estimate severity</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Headline *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3-car collision blocking highway"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Details & Scene Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe vehicles involved, smoke, or roadblocks..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="29.8543"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude *</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.8880"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Detect Location Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
          >
            {isDetectingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            <span>{isDetectingLocation ? 'Querying Device GPS...' : '📍 Auto-Detect My Live GPS Location'}</span>
          </button>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Photo (For Gemini Vision)</label>
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-3 text-center cursor-pointer transition relative bg-slate-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-28 mx-auto rounded object-cover" />
                  <span className="text-[10px] text-cyan-400 mt-1 block">Tap to change photo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Upload size={18} className="text-slate-500" />
                  <span className="text-xs font-medium">Upload or take a photo</span>
                  <span className="text-[9px] text-slate-500">JPG, PNG up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1 pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>🤖 Gemini Vision Diagnosing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Live Incident Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
