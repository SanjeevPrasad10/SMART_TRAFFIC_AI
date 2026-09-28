import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Clock, MapPin, CheckCircle2, Plus } from 'lucide-react';

// Custom SVG marker for saved incidents
const createCustomMarker = (severity, status) => {
  let color = '#38bdf8'; 
  let pulse = false;

  if (status === 'RESOLVED') {
    color = '#22c55e';
  } else if (severity === 'CRITICAL') {
    color = '#ef4444';
    pulse = true;
  } else if (severity === 'HIGH') {
    color = '#f97316';
  } else if (severity === 'MEDIUM') {
    color = '#eab308'; 
  }

  const svgIcon = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      ${pulse ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: ${color}; opacity: 0.5;" class="pulse-critical"></div>` : ''}
      <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #0f172a; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Custom SVG markr hai
const createDraftMarker = () => {
  const svg = `
    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: #ef4444;" class="pulse-critical"></div>
      <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #ef4444; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(239,68,68,0.6); cursor: pointer;">
        <span style="color: white; font-weight: 900; font-size: 18px; line-height: 1;">+</span>
      </div>
    </div>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21]
  });
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Map click detector: allow karega pin point karna whenver koi ek particular location ko click karega
const MapClickDetector = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6)
        });
      }
    }
  });
  return null;
};

export default function IncidentMap({
  incidents = [],
  selectedIncident,
  onSelectIncident,
  onStatusChange,
  draftLocation,
  onMapClick,
  onOpenReportModal
}) {

  const defaultCenter = [29.8543, 77.8880];
  const activeCenter = selectedIncident?.location?.coordinates
    ? [selectedIncident.location.coordinates[1], selectedIncident.location.coordinates[0]]
    : draftLocation
    ? [parseFloat(draftLocation.lat), parseFloat(draftLocation.lng)]
    : defaultCenter;

  return (
    <div className="w-full h-full relative">
   
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 text-xs px-3.5 py-2 rounded-lg text-slate-200 shadow-2xl flex items-center gap-2 pointer-events-none">
        <MapPin size={15} className="text-cyan-400 animate-bounce" />
        <span>Click anywhere on the map to drop a pin</span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapUpdater center={activeCenter} zoom={selectedIncident || draftLocation ? 15 : 13} />
        <MapClickDetector onMapClick={onMapClick} />

        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Live Dropped Pin when User Clicks on Map */}
        {draftLocation && (
          <Marker
            position={[parseFloat(draftLocation.lat), parseFloat(draftLocation.lng)]}
            icon={createDraftMarker()}
          >
            <Popup autoPan={true}>
              <div className="p-2 text-center min-w-[200px]">
                <p className="text-xs font-bold text-slate-100 mb-1">📍 Pinpoint Selected</p>
                <p className="text-[11px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 mb-2">
                  {draftLocation.lat}, {draftLocation.lng}
                </p>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (onOpenReportModal) onOpenReportModal();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenReportModal) onOpenReportModal();
                  }}
                  className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Report Incident Here</span>
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Saved Incidents from Database */}
        {incidents.map((incident) => {
          if (!incident.location?.coordinates || incident.location.coordinates.length < 2) return null;
          const [lng, lat] = incident.location.coordinates;

          return (
            <Marker
              key={incident._id}
              position={[lat, lng]}
              icon={createCustomMarker(incident.severity, incident.status)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(incident),
              }}
            >
              <Popup className="incident-popup">
                <div className="p-1 max-w-[280px]">
                  {incident.imageUrl && (
                    <div className="w-full h-32 mb-2 rounded overflow-hidden bg-slate-900 border border-slate-700">
                      <img
                        src={`http://localhost:5000${incident.imageUrl}`}
                        alt={incident.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{incident.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      incident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>

                  {incident.aiAnalysis?.summary && (
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800 my-2">
                      <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 mb-0.5">
                        <span>🤖 Gemini Vision Diagnosis:</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        {incident.aiAnalysis.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-slate-200">
                      Status: <span className="text-cyan-400">{incident.status}</span>
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

