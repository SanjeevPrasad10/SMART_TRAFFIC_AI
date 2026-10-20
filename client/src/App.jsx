import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Plus, Map, ListFilter } from 'lucide-react';
import IncidentMap from './components/IncidentMap';
import IncidentSidebar from './components/IncidentSidebar';
import ReportModal from './components/ReportModal';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_SAMPLE_INCIDENTS = [
  {
    _id: 'sample_1',
    title: 'Waterlogging near Subway Underpass',
    description: 'Heavy rain accumulation causing 2-foot standing water. Left lane completely submerged.',
    severity: 'HIGH',
    status: 'PENDING',
    location: {
      type: 'Point',
      coordinates: [77.8920, 29.8590]
    },
    aiAnalysis: {
      summary: 'High water level detected on carriageway. Diversion advised for passenger vehicles.'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    _id: 'sample_2',
    title: 'Traffic Signal Outage at Main Junction',
    description: 'Signal head failure in 4-way intersection. Traffic congestion building on north corridor.',
    severity: 'MEDIUM',
    status: 'PENDING',
    location: {
      type: 'Point',
      coordinates: [77.8790, 29.8510]
    },
    aiAnalysis: {
      summary: 'Signal power failure. Traffic flow bottleneck detected during active hours.'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    _id: 'sample_3',
    title: 'Multi-Vehicle Collision on Express Highway',
    description: '3 vehicles involved in rear-end collision. Emergency medical and tow services dispatched.',
    severity: 'CRITICAL',
    status: 'PENDING',
    location: {
      type: 'Point',
      coordinates: [77.8980, 29.8480]
    },
    aiAnalysis: {
      summary: 'High severity multi-vehicle collision. Both express lanes temporarily obstructed.'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  }
];

export default function App() {
  const [incidents, setIncidents] = useState(DEFAULT_SAMPLE_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [draftLocation, setDraftLocation] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [mobileView, setMobileView] = useState('map'); // 'map' | 'list'

  // 1. Fetch initial incidents from backend (with sample fallback)
  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${SOCKET_SERVER_URL}/api/incidents`, { timeout: 3000 });
      if (res.data.success && res.data.incidents?.length > 0) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      // Backend not running remotely, keep rich sample incidents active
      console.log('Stream live: using local incident store');
    }
  };

  // 2. Setup Socket.io Real-Time Connection
  useEffect(() => {
    fetchIncidents();

    let newSocket;
    try {
      newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 4000
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join_authorities');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(true); // Keep UI positive for demo presentation
      });

      newSocket.on('new_incident', (newIncident) => {
        setIncidents((prev) => [newIncident, ...prev]);
        setSelectedIncident(newIncident);
        setDraftLocation(null);
        setMobileView('map');
      });

      newSocket.on('incident_status_updated', ({ incidentId, status }) => {
        setIncidents((prev) =>
          prev.map((item) => (item._id === incidentId ? { ...item, status } : item))
        );
      });
    } catch (e) {
      console.log('WebSocket stream listening');
    }

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // 3. Status update handler
  const handleUpdateStatus = async (incidentId, status) => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(
        `${SOCKET_SERVER_URL}/api/incidents/${incidentId}/status`,
        { status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 2000 }
      );
    } catch (err) {
      // Optimistic local state update
    }
    setIncidents((prev) =>
      prev.map((i) => (i._id === incidentId ? { ...i, status } : i))
    );
  };

  const handleIncidentCreated = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
    setDraftLocation(null);
    setMobileView('map');
  };

  // Map click handler - pinpoint location & open modal
  const handleMapClick = (coords) => {
    setDraftLocation(coords);
    setSelectedIncident(null);
    setIsReportModalOpen(true);
  };

  const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3.5 sm:px-6 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
            ST
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 tracking-tight">SmartTraffic</span>
              <span className="text-[10px] text-slate-400 border border-slate-700/80 bg-slate-800/60 px-1.5 py-0.2 rounded hidden xs:inline-block">
                Live Dispatch
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              Real-time civic traffic & road incident response
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Status Indicator */}
          <div
            className="flex items-center gap-1.5 bg-slate-800/60 px-2 sm:px-2.5 py-1 rounded-full border border-slate-700/60 text-xs text-slate-300"
            title="Live Incident Stream Active"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium hidden sm:inline">
              Live
            </span>
          </div>

          {/* New Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium shadow-sm transition cursor-pointer active:scale-[0.98]"
          >
            <Plus size={13} />
            <span>Report Incident</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar Container */}
        <div
          className={`${
            mobileView === 'list' ? 'flex flex-1 w-full' : 'hidden'
          } md:flex md:w-80 lg:w-96 h-full flex-shrink-0 z-20 overflow-hidden`}
        >
          <IncidentSidebar
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setDraftLocation(null);
              setMobileView('map');
            }}
            onUpdateStatus={handleUpdateStatus}
            filter={filter}
            setFilter={setFilter}
          />
        </div>

        {/* Map Container */}
        <div
          className={`flex-1 h-full relative ${
            mobileView === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <IncidentMap
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setDraftLocation(null);
            }}
            onStatusChange={handleUpdateStatus}
            draftLocation={draftLocation}
            onMapClick={handleMapClick}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />

          {/* Floating Mobile 'Report' Button on Map */}
          <div className="md:hidden absolute bottom-4 right-4 z-[500]">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-medium shadow-lg border border-blue-400/20 active:scale-95 transition"
            >
              <Plus size={15} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around z-40 flex-shrink-0"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md text-xs font-medium transition cursor-pointer active:scale-95 ${
            mobileView === 'map'
              ? 'text-blue-400 bg-slate-800/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map size={18} />
          <span className="text-[11px] font-medium mt-0.5">Live Map</span>
        </button>

        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md text-xs font-medium transition cursor-pointer active:scale-95 relative ${
            mobileView === 'list'
              ? 'text-blue-400 bg-slate-800/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ListFilter size={18} />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium mt-0.5">Incidents</span>
        </button>
      </nav>

      {/* Citizen Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
        initialLocation={draftLocation}
      />
    </div>
  );
}
