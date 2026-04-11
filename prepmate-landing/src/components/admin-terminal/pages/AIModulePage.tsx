import React from 'react';
import { BrainCircuit, Cpu, AlertCircle, TrendingUp, Key } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchAIUsage } from '../services/adminApi';
import { StatsCard } from '../components/StatsCard';

export const AIModulePage: React.FC = () => {
  const { data } = useAdminData(fetchAIUsage, {});

  const configuredUsers = data?.configuredUsers || 0;
  const validKeys = data?.validApiKeys || 0;
  const keyHealth = configuredUsers > 0 ? Math.round((validKeys / configuredUsers) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1 flex items-center">
            <BrainCircuit className="mr-2 text-indigo-500" /> AI Command Center
          </h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Monitor AI usage, API keys, and model performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Configured Users" 
          value={configuredUsers} 
          icon={Key} 
          iconColor="text-indigo-400"
        />
        <StatsCard 
          title="Total AI Interviews" 
          value={data?.totalAIInterviews || 0} 
          icon={Cpu}
          iconColor="text-emerald-400" 
        />
        <StatsCard 
          title="Requests (24h)" 
          value={data?.usage?.requestsToday || 0} 
          icon={TrendingUp}
          iconColor="text-blue-400" 
        />
        <StatsCard 
          title="Errors (24h)" 
          value={data?.usage?.errorsToday || 0} 
          icon={AlertCircle}
          iconColor="text-[var(--admin-error)]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="admin-card p-6 min-h-[300px] flex flex-col">
          <h3 className="font-semibold text-[var(--admin-on-surface)] mb-4">AI Usage Summary (24h)</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-[var(--admin-outline)] pb-2">
              <span className="text-[var(--admin-on-surface-muted)]">Estimated cost</span>
              <span className="font-semibold text-[var(--admin-on-surface)]">{data?.usage?.estimatedCost || '$0.00'}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--admin-outline)] pb-2">
              <span className="text-[var(--admin-on-surface-muted)]">Valid API key rate</span>
              <span className="font-semibold text-[var(--admin-on-surface)]">{keyHealth}%</span>
            </div>
            <div className="flex justify-between border-b border-[var(--admin-outline)] pb-2">
              <span className="text-[var(--admin-on-surface-muted)]">Configured users</span>
              <span className="font-semibold text-[var(--admin-on-surface)]">{configuredUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--admin-on-surface-muted)]">Valid keys</span>
              <span className="font-semibold text-[var(--admin-on-surface)]">{validKeys}</span>
            </div>
          </div>
        </div>

        <div className="admin-card p-6 min-h-[300px] flex flex-col overflow-hidden">
          <h3 className="font-semibold text-[var(--admin-on-surface)] mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2 text-amber-500" /> Flagged Interactions
          </h3>
          <div className="flex-1 overflow-y-auto admin-terminal scrollbar-thin">
            {data?.usage?.errorsToday ? (
              <div className="space-y-3">
                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-sm text-amber-600">
                  {data.usage.errorsToday} interactions were flagged in the last 24 hours.
                </div>
                <p className="text-xs text-[var(--admin-on-surface-muted)]">
                  Detailed per-interaction records are not yet exposed by backend telemetry.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--admin-on-surface-muted)]">
                No flagged AI interactions in the last 24 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModulePage;
