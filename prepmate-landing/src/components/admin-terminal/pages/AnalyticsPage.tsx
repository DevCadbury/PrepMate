import React from 'react';
import { Activity, Users, MessageSquare, TrendingUp, BarChart2 } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchAnalytics } from '../services/adminApi';
import { StatsCard } from '../components/StatsCard';
import { MiniChart } from '../components/MiniChart';

export const AnalyticsPage: React.FC = () => {
  const { data, loading } = useAdminData(fetchAnalytics, {});

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse w-full">
        <div className="h-8 bg-[var(--admin-surface-container)] rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--admin-surface-container)] rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1 flex items-center">
            <BarChart2 className="mr-2 text-[var(--admin-primary)]" /> Advanced Analytics
          </h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Deep dive into user behavior, engagement, and revenue.</p>
        </div>
        <button className="px-4 py-2 bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline)] text-[var(--admin-on-surface)] rounded-md hover:bg-[var(--admin-surface-container-highest)] text-sm font-medium transition-colors">
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Daily Active (DAU)" 
          value={data?.users.dailyActive?.toLocaleString() || 0} 
          icon={Activity} 
          iconColor="text-emerald-400"
        />
        <StatsCard 
          title="Monthly Active (MAU)" 
          value={data?.users.monthlyActive?.toLocaleString() || 0} 
          icon={Users}
          iconColor="text-blue-400" 
        />
        <StatsCard 
          title="Avg Posts / User" 
          value={data?.engagement.avgPostsPerUser || 0} 
          icon={MessageSquare}
          iconColor="text-indigo-400" 
        />
        <StatsCard 
          title="Total Paid Subs" 
          value={data?.revenue.paidUsers || 0} 
          icon={TrendingUp}
          iconColor="text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Chart Area */}
        <div className="admin-card p-6 lg:col-span-2">
          <h3 className="font-semibold text-[var(--admin-on-surface)] mb-6">User Acquisition trend</h3>
          <div className="w-full h-64 bg-[var(--admin-surface)] rounded flex items-end relative overflow-hidden group">
            {data?.growthChart && data.growthChart.length > 0 ? (
              <div className="w-full h-full relative p-2">
                <MiniChart 
                  data={data.growthChart.map(d => d.count)} 
                  height={220} 
                  color="#10b981" 
                />
              </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--admin-on-surface-muted)] text-sm">
                  Insufficient data for trend chart
                </div>
            )}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="admin-card p-6 flex flex-col">
          <h3 className="font-semibold text-[var(--admin-on-surface)] mb-4">Subscription Demographics</h3>
          <div className="flex-1 space-y-4">
             {Object.entries(data?.revenue.subscriptions || { free: 0, basic: 0, premium: 0 }).map(([tier, count]) => {
               const total = data?.users.total || 1;
               const percent = ((Number(count) / total) * 100).toFixed(1);
               return (
                 <div key={tier}>
                   <div className="flex justify-between text-sm mb-1 text-[var(--admin-on-surface)]">
                     <span className="capitalize">{tier}</span>
                     <span>{count} <span className="text-[var(--admin-on-surface-muted)] text-xs">({percent}%)</span></span>
                   </div>
                   <div className="h-2 w-full bg-[var(--admin-surface-container-highest)] rounded-full overflow-hidden">
                     <div 
                       className={`h-full rounded-full ${tier === 'free' ? 'bg-gray-400' : tier === 'basic' ? 'bg-blue-400' : 'bg-indigo-500'}`} 
                       style={{ width: `${percent}%` }}
                     ></div>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
