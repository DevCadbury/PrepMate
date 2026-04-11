import React, { useEffect, useState } from 'react';
import { Users, Activity, CreditCard, AlertTriangle, MonitorPlay, ShieldAlert, Code2, MessageSquare } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { MiniChart } from '../components/MiniChart';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { fetchAIUsage, fetchAnalytics, fetchOverview, fetchSystemHealth, fetchActivityLogs } from '../services/adminApi';
import type { AIUsageData, AnalyticsData, SystemHealth } from '../types';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<{
    analytics: AnalyticsData | null;
    health: SystemHealth | null;
    logs: string[];
    overview: {
      users: { total: number; active: number; admins: number; support: number };
      social: { totalPosts: number; hiddenPosts: number; reportedPosts: number; openChatReports: number };
      support: { totalTickets: number; openTickets: number };
      coding: { pendingSubmissions: number };
    } | null;
    aiUsage: AIUsageData | null;
  }>({ analytics: null, health: null, logs: [], overview: null, aiUsage: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [analyticsRes, healthRes, logsRes, overviewRes, aiRes] = await Promise.allSettled([
          fetchAnalytics(),
          fetchSystemHealth(),
          fetchActivityLogs(20),
          fetchOverview(),
          fetchAIUsage(),
        ]);

        if (mounted) {
          setData({
            analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
            health: healthRes.status === 'fulfilled' ? healthRes.value : null,
            logs: logsRes.status === 'fulfilled' ? logsRes.value : [],
            overview: overviewRes.status === 'fulfilled' ? overviewRes.value : null,
            aiUsage: aiRes.status === 'fulfilled' ? aiRes.value : null,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-[var(--admin-surface-container)] rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--admin-surface-container)] rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  const { analytics, health, logs, overview, aiUsage } = data;
  const pendingContentReports = overview?.social?.reportedPosts || 0;
  const openChatReports = overview?.social?.openChatReports || 0;
  const pendingItems = pendingContentReports + openChatReports;
  const flaggedAiInteractions = aiUsage?.usage?.errorsToday || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1">Command Center</h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Monitor platform health and key metrics in real-time.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] text-[var(--admin-on-surface)] rounded-md hover:bg-[var(--admin-surface-container-highest)] text-sm font-medium transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Pending Actions Banner */}
      {(pendingItems > 0 || flaggedAiInteractions > 0) && (
        <div className="bg-[var(--admin-warning-muted)] border border-amber-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center text-amber-500">
            <AlertTriangle size={20} className="mr-3" />
            <span className="font-medium text-sm">
              Requires attention: {pendingItems} open moderation reports and {flaggedAiInteractions} flagged AI interactions (24h).
            </span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={analytics?.users?.total?.toLocaleString() || '---'} 
          icon={Users} 
          change={parseFloat(analytics?.users?.growthPercent as string) || 0}
          changeLabel="this month"
        />
        <StatsCard 
          title="Active Users (30d)" 
          value={analytics?.users?.monthlyActive?.toLocaleString() || '---'} 
          icon={Activity}
          iconColor="text-emerald-500" 
        />
        <StatsCard 
          title="Live Interviews" 
          value={analytics?.interviews?.thisWeek || 0} 
          icon={MonitorPlay}
          iconColor="text-indigo-400"
        />
        <StatsCard 
          title="Estimated MRR" 
          value={`$${analytics?.revenue?.mrr || '0.00'}`} 
          icon={CreditCard}
          iconColor="text-amber-400" 
        />
      </div>

      {/* Charts & System Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="admin-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-[var(--admin-on-surface)]">User Growth (Last 7 Days)</h3>
            <select className="admin-input py-1 px-2 text-xs w-auto">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 min-h-[200px] flex items-end relative">
            <div className="absolute inset-0 flex flex-col justify-between hidden sm:flex">
              <div className="border-t border-[var(--admin-outline-variant)] opacity-20 w-full h-0"></div>
              <div className="border-t border-[var(--admin-outline-variant)] opacity-20 w-full h-0"></div>
              <div className="border-t border-[var(--admin-outline-variant)] opacity-20 w-full h-0"></div>
              <div className="border-t border-[var(--admin-outline-variant)] opacity-20 w-full h-0"></div>
              <div className="border-t border-[var(--admin-outline-variant)] opacity-20 w-full h-0"></div>
            </div>
            {analytics?.growthChart && analytics.growthChart.length > 0 ? (
              <div className="w-full relative z-10 pt-4">
                <MiniChart 
                  data={analytics.growthChart.map(d => d.count)} 
                  height={180} 
                  color="#3f68e0" 
                />
                <div className="flex justify-between mt-2 text-xs text-[var(--admin-on-surface-muted)]">
                  {analytics.growthChart.map((d, i) => (
                    <span key={i} className="mx-1">{d._id.split('-').slice(1).join('/')}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--admin-on-surface-muted)] text-sm">
                No growth data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="admin-card p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-[var(--admin-on-surface)]">System Status</h3>
            <button className="text-xs text-[var(--admin-primary)]">Refresh</button>
          </div>
          <div className="space-y-4 flex-1">
            {(health?.services || []).map((service: any, i: number) => (
              <SystemHealthCard
                key={i}
                name={service.name}
                status={service.status}
                latency={service.latency}
                uptime={service.uptime}
              />
            ))}
            {(!health?.services || health.services.length === 0) && (
              <p className="text-sm text-[var(--admin-on-surface-muted)]">
                System health data is not available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityLogTable logs={logs} />
        
        <div className="admin-card p-5">
           <h3 className="font-semibold text-[var(--admin-on-surface)] mb-4">Quick Actions</h3>
           <div className="grid grid-cols-2 gap-4">
             <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] hover:border-[var(--admin-primary)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-primary)] transition-all duration-300 admin-card-interactive">
               <Users size={24} className="mb-2" />
               <span className="text-sm font-medium">Add User</span>
             </button>
             <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] hover:border-[var(--admin-primary)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-primary)] transition-all duration-300 admin-card-interactive">
               <ShieldAlert size={24} className="mb-2" />
               <span className="text-sm font-medium">Review Flags</span>
             </button>
             <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] hover:border-[var(--admin-primary)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-primary)] transition-all duration-300 admin-card-interactive">
               <Code2 size={24} className="mb-2" />
               <span className="text-sm font-medium">Manage Problems</span>
             </button>
             <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] hover:border-[var(--admin-primary)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-primary)] transition-all duration-300 admin-card-interactive">
               <MessageSquare size={24} className="mb-2" />
               <span className="text-sm font-medium">Support Center</span>
             </button>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardPage;
