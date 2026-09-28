import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldCheck, Flame, ChevronRight, Navigation } from 'lucide-react';

export default function IncidentSidebar({
  incidents = [],
  selectedIncident,
  onSelectIncident,
  onUpdateStatus,
  filter,
  setFilter
}) {
  const filtered = incidents.filter((item) => {
    if (filter === 'CRITICAL') return item.severity === 'CRITICAL' || item.severity === 'HIGH';
    if (filter === 'ACTIVE') return item.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return item.status === 'RESOLVED';
    return true;
  });

  return (
    <aside className="w-80 md:w-96 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-20 flex-shrink-0 shadow-xl">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <span>🚨 Active Incidents</span>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-mono">
              {incidents.filter(i => i.status !== 'RESOLVED').length}
            </span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'CRITICAL', label: 'High Priority' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-600" />
            <p>No incidents matching filter</p>
          </div>
        ) : (
          filtered.map((incident) => {
            const isSelected = selectedIncident?._id === incident._id;

            return (
              <div
                key={incident._id}
                onClick={() => onSelectIncident(incident)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                {/* Header: Title & Severity */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-xs text-slate-100 line-clamp-1 flex-1">
                    {incident.title}
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                      incident.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : incident.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : incident.severity === 'MEDIUM'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>

                
                {incident.aiAnalysis?.summary && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                    {incident.aiAnalysis.summary}
                  </p>
                )}

                {/* Status & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={11} />
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {incident.status !== 'RESOLVED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(incident._id, 'RESOLVED');
                        }}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded font-medium transition"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={11} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
