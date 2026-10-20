import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Radio, Plus, Map, ListFilter, AlertCircle } from 'lucide-react';
import IncidentMap from './components/IncidentMap';
import IncidentSidebar from './components/IncidentSidebar';
import ReportModal from './components/ReportModal';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [draftLocation, setDraftLocation] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [mobileView, setMobileView] = useState('map'); // 'map' | 'list'

  // 1. Fetch initial incidents from backend
  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${SOCKET_SERVER_URL}/api/incidents`);
      if (res.data.success) {
        setIncidents(res.data.incidents || []);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  // 2. Setup Socket.io Real-Time Connection
  useEffect(() => {
    fetchIncidents();

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to SmartTraffic WebSocket server:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join_authorities');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for new incidents pushed in real time
    newSocket.on('new_incident', (newIncident) => {
      console.log('🚨 Real-time incident received:', newIncident);
      setIncidents((prev) => [newIncident, ...prev]);
      setSelectedIncident(newIncident);
      setDraftLocation(null);
      setMobileView('map');
    });

    // Listen for status updates
    newSocket.on('incident_status_updated', ({ incidentId, status }) => {
      setIncidents((prev) =>
        prev.map((item) => (item._id === incidentId ? { ...item, status } : item))
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 3. Status update handler
  const handleUpdateStatus = async (incidentId, status) => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.patch(
        `${SOCKET_SERVER_URL}/api/incidents/${incidentId}/status`,
        { status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setIncidents((prev) =>
        prev.map((i) => (i._id === incidentId ? { ...i, status } : i))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar (Responsive) */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
            <Radio size={18} className="text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xs sm:text-sm tracking-tight text-slate-100 flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">SmartTraffic AI</span>
              <span className="text-[9px] sm:text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono hidden xs:inline-block">
                Gemini 2.5
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              Autonomous Civic Dispatch & Geospatial Triage
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Socket Status Pill */}
          <div
            className="flex items-center gap-1.5 bg-slate-800/80 px-2 sm:px-2.5 py-1 rounded-full border border-slate-700/80 text-xs"
            title={isConnected ? 'WebSocket Live' : 'Disconnected'}
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 hidden sm:inline">
              {isConnected ? 'WebSocket Live' : 'Offline'}
            </span>
          </div>

          {/* Citizen Report Button (Navbar) */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/30 transition cursor-pointer"
          >
            <Plus size={14} />
            <span className="inline">Report</span>
            <span className="hidden sm:inline">Incident</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen: Sidebar (desktop or mobile tab) + Leaflet Map */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar Container (Full width on mobile if 'list' active, fixed side-column on desktop) */}
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
              setMobileView('map'); // Switch to map automatically on mobile when an incident is tapped
            }}
            onUpdateStatus={handleUpdateStatus}
            filter={filter}
            setFilter={setFilter}
          />
        </div>

        {/* Map Container (Full screen on mobile if 'map' active, takes remaining space on desktop) */}
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
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full text-xs font-bold shadow-xl shadow-red-600/40 border border-red-400/30 active:scale-95 transition"
            >
              <Plus size={18} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < md) */}
      <nav className="md:hidden bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-around z-30 flex-shrink-0 safe-bottom">
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition ${
            mobileView === 'map'
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map size={18} />
          <span className="text-[10px] mt-0.5">Live Map</span>
        </button>

        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition relative ${
            mobileView === 'list'
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ListFilter size={18} />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Incidents</span>
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
