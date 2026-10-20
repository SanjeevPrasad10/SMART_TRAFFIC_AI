import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Plus, Map, ListFilter } from 'lucide-react';
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
      console.log('Connected to incident stream:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join_authorities');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from stream');
      setIsConnected(false);
    });

    // Listen for new incidents pushed in real time
    newSocket.on('new_incident', (newIncident) => {
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
      {/* Human, Clean SaaS Header */}
      <header className="h-13 bg-slate-900 border-b border-slate-800 px-3.5 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
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
            title={isConnected ? 'Live WebSocket connection' : 'Offline'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-[11px] font-medium hidden sm:inline">
              {isConnected ? 'Live' : 'Offline'}
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

      {/* Main Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
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
      <nav className="md:hidden bg-slate-900 border-t border-slate-800 p-1.5 flex items-center justify-around z-30 flex-shrink-0">
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md text-xs font-medium transition ${
            mobileView === 'map'
              ? 'text-blue-400 bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map size={16} />
          <span className="text-[10px] mt-0.5">Live Map</span>
        </button>

        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md text-xs font-medium transition relative ${
            mobileView === 'list'
              ? 'text-blue-400 bg-slate-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ListFilter size={16} />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1 rounded-full">
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
