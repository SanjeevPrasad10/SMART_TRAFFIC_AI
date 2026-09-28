import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Radio, Plus } from 'lucide-react';
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
      setSelectedIncident(newIncident); // Auto-fly to latest incident
      setDraftLocation(null);
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
  };

  // Map click handler - pinpoint location & open modal
  const handleMapClick = (coords) => {
    setDraftLocation(coords);
    setSelectedIncident(null);
    setIsReportModalOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Radio size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-2">
              <span>SmartTraffic AI</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded font-mono">
                Gemini 2.5 Vision
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Autonomous Civic Dispatch & Geospatial Triage</p>
          </div>
        </div>

        {/* Right Stats & Actions */}
        <div className="flex items-center gap-3">
          {/* Socket Status Pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/80 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span className="text-[11px] font-medium text-slate-300">
              {isConnected ? 'WebSocket Live' : 'Disconnected'}
            </span>
          </div>

          {/* Citizen Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/30 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Report Incident</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen: Sidebar + Leaflet Map */}
      <main className="flex-1 flex overflow-hidden relative">
        <IncidentSidebar
          incidents={incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            setDraftLocation(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          filter={filter}
          setFilter={setFilter}
        />

        <div className="flex-1 h-full relative">
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
        </div>
      </main>

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
