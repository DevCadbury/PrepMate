import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number; // percentage change
  changeLabel?: string;
  iconColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  iconColor = 'text-[var(--admin-primary)]'
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className="admin-card admin-card-interactive p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-[var(--admin-on-surface-variant)] font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--admin-on-surface)]">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-[var(--admin-surface-container-highest)] ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="flex items-center text-xs mt-auto">
          <span 
            className={`flex items-center font-medium ${
              isPositive ? 'text-[var(--admin-success)]' : 
              isNegative ? 'text-[var(--admin-error)]' : 
              'text-[var(--admin-on-surface-variant)]'
            }`}
          >
            {isPositive ? <TrendingUp size={14} className="mr-1" /> : 
             isNegative ? <TrendingDown size={14} className="mr-1" /> : 
             <Minus size={14} className="mr-1" />}
            {Math.abs(change)}%
          </span>
          <span className="text-[var(--admin-on-surface-muted)] ml-2">{changeLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};
