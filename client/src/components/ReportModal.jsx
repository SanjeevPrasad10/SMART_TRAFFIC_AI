import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, MapPin, Camera, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, onIncidentCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

      const response = await axios.post('http://localhost:5000/api/incidents', formData, {
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
    <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ zIndex: 99999 }}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Report Traffic Incident</h3>
              <p className="text-xs text-slate-400">Gemini AI will automatically diagnose severity & triage</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
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
              placeholder="e.g. 3-car collision blocking highway exit"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Details & Scene Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe vehicles involved, injuries, smoke, or roadblocks..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="29.8543"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
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
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Detect Location Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            {isDetectingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            <span>{isDetectingLocation ? 'Querying Device GPS...' : '📍 Auto-Detect My Live GPS Location'}</span>
          </button>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Photo (For Gemini Vision)</label>
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-4 text-center cursor-pointer transition relative bg-slate-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-32 mx-auto rounded object-cover" />
                  <span className="text-[10px] text-cyan-400 mt-1 block">Click to change photo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Upload size={20} className="text-slate-500" />
                  <span className="text-xs font-medium">Click to upload or take a photo</span>
                  <span className="text-[10px] text-slate-500">Supports JPG, PNG up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>🤖 Gemini Vision Diagnosing Incident...</span>
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
