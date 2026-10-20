import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Clock, MapPin, CheckCircle2, Plus } from 'lucide-react';

// Custom clean marker for incidents
const createCustomMarker = (severity, status) => {
  let color = '#3b82f6';

  if (status === 'RESOLVED') {
    color = '#10b981';
  } else if (severity === 'CRITICAL') {
    color = '#ef4444';
  } else if (severity === 'HIGH') {
    color = '#f97316';
  } else if (severity === 'MEDIUM') {
    color = '#f59e0b';
  }

  const svgIcon = `
    <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
      <div style="width: 7px; height: 7px; border-radius: 50%; background-color: ${color};"></div>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

// Clean pin for user map click
const createDraftMarker = () => {
  const svg = `
    <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #2563eb; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.4); cursor: pointer;">
      <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
    </div>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

// Map click detector
const MapClickDetector = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
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
      {/* Subtle Map Instructions */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-xs px-3 py-1.5 rounded-md text-slate-300 shadow-md flex items-center gap-1.5 pointer-events-none">
        <MapPin size={12} className="text-blue-400" />
        <span>Click map to report location</span>
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
              <div className="p-1.5 text-center min-w-[180px]">
                <p className="text-xs font-semibold text-slate-100 mb-1">Selected Location</p>
                <p className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mb-2">
                  {Number(draftLocation.lat).toFixed(4)}, {Number(draftLocation.lng).toFixed(4)}
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
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Report at this location</span>
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
                <div className="p-1 max-w-[270px]">
                  {incident.imageUrl && (
                    <div className="w-full h-32 mb-2 rounded overflow-hidden bg-slate-900 border border-slate-800">
                      <img
                        src={
                          incident.imageUrl.startsWith('blob:') || incident.imageUrl.startsWith('data:') || incident.imageUrl.startsWith('http')
                            ? incident.imageUrl
                            : `http://localhost:5000${incident.imageUrl}`
                        }
                        alt={incident.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="font-semibold text-xs text-slate-100 line-clamp-1">{incident.title}</h4>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {incident.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} />
                      {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {incident.status !== 'RESOLVED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStatusChange) onStatusChange(incident._id, 'RESOLVED');
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 size={11} /> Resolved
                      </span>
                    )}
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
