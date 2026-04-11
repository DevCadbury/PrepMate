import React from 'react';
import { AlertCircle, Clock, Check, Trash2 } from 'lucide-react';
import { ContentPost } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface ReportCardProps {
  post: ContentPost;
  onAction: (action: string, postId: string) => void;
  onClick: () => void;
  isActive?: boolean;
  canModerate?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({ post, onAction, onClick, isActive, canModerate = true }) => {
  const getSeverityColor = (count: number) => {
    if (count >= 5) return 'border-l-[var(--admin-error)]';
    if (count >= 3) return 'border-l-amber-500';
    return 'border-l-[var(--admin-warning)]';
  };

  const getReasonLabel = (reason: string) => {
    if (!reason) return 'unspecified';
    const clean = reason.toLowerCase().replace('_', ' ');
    if (clean.includes('spam')) return 'Spam / Phishing';
    if (clean.includes('hate') || clean.includes('harassment')) return 'Hate Speech';
    if (clean.includes('nsfw')) return 'NSFW content';
    return clean;
  };

  return (
    <div 
      onClick={onClick}
      className={`admin-card border-l-4 ${getSeverityColor(post.pendingReportsCount)} p-4 cursor-pointer transition-all duration-200
      ${isActive ? 'bg-[var(--admin-surface-container-high)] border-r border-t border-b border-[var(--admin-primary)] shadow-md shadow-[var(--admin-primary-muted)]' : 'hover:bg-[var(--admin-surface-container-high)]'}
      `}
      style={{ borderLeftWidth: '4px' }} // Tailwind override
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-[var(--admin-surface-container-highest)] rounded-full overflow-hidden flex items-center justify-center border border-[var(--admin-outline)]">
            {post.user?.profilePicture ? (
              <img src={post.user.profilePicture} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[var(--admin-on-surface-variant)] text-sm font-bold">{post.user?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-[var(--admin-on-surface)] truncate max-w-[150px]">{post.user?.name || 'Unknown User'}</p>
            <p className="text-xs text-[var(--admin-on-surface-muted)]">@{post.user?.username || 'unknown'}</p>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`admin-badge ${post.pendingReportsCount >= 5 ? 'admin-badge-error' : 'bg-amber-500/10 text-amber-500'} font-bold mb-1 block`}>
            {post.pendingReportsCount} Report{post.pendingReportsCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center text-xs text-[var(--admin-on-surface-muted)] justify-end">
            <Clock size={12} className="mr-1" />
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="bg-[var(--admin-surface)] rounded-md p-3 mb-4 border border-[var(--admin-outline)]">
        <div className="flex items-center text-xs text-amber-500 font-medium mb-1.5 uppercase tracking-wide">
          <AlertCircle size={14} className="mr-1.5" />
          Flagged for: {getReasonLabel(post.latestReportReason)}
        </div>
        <p className="text-sm text-[var(--admin-on-surface-variant)] line-clamp-3 leading-relaxed">
          {post.contentPreview || 'Media content attached without text description.'}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--admin-outline)] mt-auto" onClick={e => e.stopPropagation()}>
        {canModerate ? (
          <>
            <ConfirmDialog 
              trigger={
                 <button className="flex-1 min-w-[70px] py-1.5 px-2 bg-[var(--admin-surface-container-highest)] hover:bg-[var(--admin-success-muted)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-success)] rounded border border-[var(--admin-outline)] hover:border-emerald-500/30 transition-colors flex items-center justify-center text-xs font-medium">
                  <Check size={14} className="mr-1.5" /> Approve
                </button>
              }
              title="Approve Content"
              description="This will dismiss all pending reports and keep the content visible."
              actionText="Approve"
              onConfirm={() => onAction('approve', post.id)}
            />

            <ConfirmDialog 
              trigger={
                <button className="flex-1 min-w-[70px] py-1.5 px-2 bg-[var(--admin-surface-container-highest)] hover:bg-[var(--admin-error-muted)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-error)] rounded border border-[var(--admin-outline)] hover:border-rose-500/30 transition-colors flex items-center justify-center text-xs font-medium">
                  <Trash2 size={14} className="mr-1.5" /> Remove
                </button>
              }
              title="Remove Content"
              description="This will permanently delete the content from the platform and notify the user."
              variant="destructive"
              actionText="Remove"
              onConfirm={() => onAction('remove', post.id)}
            />
          </>
        ) : (
          <span className="text-xs text-[var(--admin-on-surface-muted)]">Read-only access</span>
        )}
      </div>
    </div>
  );
};
