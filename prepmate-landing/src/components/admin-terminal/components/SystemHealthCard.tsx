import React from 'react';
import { Server, Database, BrainCircuit, Activity } from 'lucide-react';

interface SystemHealthCardProps {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
  uptime: string;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ name, status, latency, uptime }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'operational': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-rose-500';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = () => {
    switch (name.toLowerCase()) {
      case 'database': return <Database size={16} />;
      case 'ai engine': return <BrainCircuit size={16} />;
      case 'api gateway': return <Activity size={16} />;
      default: return <Server size={16} />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-[var(--admin-outline)] rounded-lg bg-[var(--admin-surface-container)]">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-md bg-[var(--admin-surface-container-high)] text-[var(--admin-on-surface-variant)] border border-[var(--admin-outline-variant)]">
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-[var(--admin-on-surface)]">{name}</span>
            <span className="relative flex h-2.5 w-2.5">
              {status === 'operational' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor()}`}></span>
            </span>
          </div>
          <p className="text-xs text-[var(--admin-on-surface-muted)] capitalize mt-0.5">{status}</p>
        </div>
      </div>
      
      <div className="flex space-x-4 text-right">
        <div>
          <p className="text-xs text-[var(--admin-on-surface-muted)] mb-0.5">Latency</p>
          <p className="text-sm font-mono text-[var(--admin-on-surface)]">{latency}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--admin-on-surface-muted)] mb-0.5">Uptime</p>
          <p className="text-sm font-mono text-[var(--admin-on-surface)]">{uptime}</p>
        </div>
      </div>
    </div>
  );
};
