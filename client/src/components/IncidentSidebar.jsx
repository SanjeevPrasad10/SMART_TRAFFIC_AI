import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

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
    <aside className="w-full h-full bg-slate-900 border-r border-slate-800 flex flex-col z-20 flex-shrink-0">
      {/* Top Filter Bar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-semibold text-slate-100 text-xs sm:text-sm tracking-tight flex items-center gap-2">
            <span>Incident Feed</span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.2 rounded-full font-mono">
              {incidents.filter(i => i.status !== 'RESOLVED').length} active
            </span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 text-xs overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'CRITICAL', label: 'High Priority' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-slate-600" />
            <p>No incidents in this category</p>
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
                    ? 'bg-slate-800/90 border-blue-500/60 shadow-sm'
                    : 'bg-slate-800/30 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {/* Header: Title & Severity */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-xs sm:text-sm text-slate-100 line-clamp-1 flex-1">
                    {incident.title}
                  </h3>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 ${
                      incident.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : incident.severity === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : incident.severity === 'MEDIUM'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>

                {incident.aiAnalysis?.summary && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {incident.aiAnalysis.summary}
                  </p>
                )}

                {/* Footer: Time & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-slate-500">
                    <Clock size={11} />
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div>
                    {incident.status !== 'RESOLVED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(incident._id, 'RESOLVED');
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-medium transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium text-[10px]">
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
