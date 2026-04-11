import React from 'react';
import { Shield, ShieldAlert, MessageSquare, AlertTriangle, UserX, UserMinus, ShieldBan, Tag } from 'lucide-react';
import { ContentPost } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface CaseContextPanelProps {
  post: ContentPost | null;
  onAction: (action: string, postId: string) => void;
  canModerate?: boolean;
}

export const CaseContextPanel: React.FC<CaseContextPanelProps> = ({ post, onAction, canModerate = true }) => {
  if (!post) {
    return (
      <div className="admin-card h-[calc(100vh-140px)] sticky top-24 flex flex-col items-center justify-center p-8 text-center bg-[var(--admin-surface)] border-dashed">
        <div className="w-16 h-16 rounded-full bg-[var(--admin-surface-container)] flex items-center justify-center mb-4 border border-[var(--admin-outline)]">
          <ShieldAlert size={32} className="text-[var(--admin-on-surface-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--admin-on-surface)] mb-2">No Case Selected</h3>
        <p className="text-[var(--admin-on-surface-muted)] text-sm max-w-xs">
          Select a report from the list to view detailed context and moderation controls.
        </p>
      </div>
    );
  }
  
  return (
    <div className="admin-card h-[calc(100vh-140px)] sticky top-24 flex flex-col bg-[var(--admin-surface)] overflow-hidden">
      <div className="p-4 border-b border-[var(--admin-outline)] bg-[var(--admin-surface-container)] flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-base flex items-center text-[var(--admin-on-surface)]">
          <Shield size={18} className="mr-2 text-[var(--admin-primary)]" />
          Case Context
        </h2>
        <span className="text-xs text-[var(--admin-on-surface-muted)] px-2 py-1 bg-[var(--admin-surface)] rounded border border-[var(--admin-outline)] font-mono">
          ID: {post.id.slice(-6)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto admin-terminal scrollbar-thin p-5 space-y-6">
        
        {/* Author Profile */}
        <section>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--admin-on-surface-muted)] mb-3 flex items-center">
            <UserX size={14} className="mr-1.5" /> Author
          </h3>
          <div className="flex items-center p-4 border border-[var(--admin-outline)] rounded-lg bg-[var(--admin-surface-container)]">
            <div className="h-11 w-11 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-outline)] flex items-center justify-center overflow-hidden mr-4">
              {post.user?.profilePicture ? (
                <img src={post.user.profilePicture} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[var(--admin-on-surface-variant)] text-xs font-bold">
                  {post.user?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-[var(--admin-on-surface)]">{post.user?.name || 'Unknown user'}</p>
              <p className="text-xs text-[var(--admin-on-surface-muted)] mt-0.5">@{post.user?.username || 'unknown'}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-medium text-sm text-[var(--admin-on-surface)]">{post.pendingReportsCount}</p>
              <p className="text-xs text-[var(--admin-on-surface-muted)] mt-0.5">Pending reports</p>
            </div>
          </div>
        </section>

        {/* Report Summary */}
        <section>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--admin-on-surface-muted)] mb-3 flex items-center">
            <AlertTriangle size={14} className="mr-1.5" /> Report Summary
          </h3>
          <div className="p-4 border border-[var(--admin-outline)] rounded-lg bg-[var(--admin-surface-container)] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--admin-on-surface-muted)]">Current status</span>
              <span className="text-[var(--admin-on-surface)] font-medium capitalize">{post.status || 'pending'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--admin-on-surface-muted)]">Total reports</span>
              <span className="text-[var(--admin-on-surface)] font-medium">{post.reportsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--admin-on-surface-muted)]">Pending reports</span>
              <span className="text-[var(--admin-on-surface)] font-medium">{post.pendingReportsCount}</span>
            </div>
            <div>
              <p className="text-xs text-[var(--admin-on-surface-muted)] mb-1">Latest reason</p>
              <p className="text-sm text-[var(--admin-on-surface)]">{post.latestReportReason || 'No reason provided'}</p>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--admin-on-surface-muted)] mb-3 flex items-center">
            <Tag size={14} className="mr-1.5" /> Metadata
          </h3>
          <div className="p-4 border border-[var(--admin-outline)] rounded-lg bg-[var(--admin-surface-container)]">
            <div className="flex flex-wrap gap-2">
              {(post.tags || []).length > 0 ? (
                post.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-1 rounded border border-[var(--admin-outline)] bg-[var(--admin-surface)] text-[var(--admin-on-surface-variant)]">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--admin-on-surface-muted)]">No tags available</span>
              )}
            </div>
          </div>
        </section>

        {/* Full Content */}
        <section>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--admin-on-surface-muted)] mb-3 flex items-center">
            <MessageSquare size={14} className="mr-1.5" /> Content Source
          </h3>
          <div className="p-4 border border-[var(--admin-outline)] rounded-lg bg-[var(--admin-surface-container)] text-sm text-[var(--admin-on-surface)] whitespace-pre-wrap leading-relaxed font-mono">
             {post.contentPreview || 'No text content available.'}
          </div>
        </section>

      </div>

      <div className="p-4 border-t border-[var(--admin-outline)] bg-[var(--admin-surface-container)] shrink-0">
        {canModerate ? (
          <div className="grid grid-cols-2 gap-3">
            <ConfirmDialog 
              trigger={
                 <button className="flex items-center justify-center py-2.5 px-4 bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-container-high)] text-[var(--admin-on-surface)] rounded-md border border-[var(--admin-outline)] transition-colors text-sm font-medium w-full shadow-sm">
                    <UserMinus size={16} className="mr-2 text-amber-500" /> Timeout (24h)
                 </button>
              }
              title="Timeout User?"
              description="This will restrict the user from posting or commenting for 24 hours. The reported content will also be removed."
              actionText="Apply Timeout"
              variant="warning"
              onConfirm={() => onAction('timeout', post.id)}
            />
            <ConfirmDialog 
              trigger={
                <button className="flex items-center justify-center py-2.5 px-4 bg-[var(--admin-error)] hover:bg-rose-600 text-white rounded-md transition-colors text-sm font-medium w-full shadow-sm">
                    <ShieldBan size={16} className="mr-2" /> Ban User
                 </button>
              }
              title="Ban User permanently?"
              description={`Are you sure you want to permanently ban ${post.user?.name}? This action cannot be undone and will delete all their content.`}
              actionText="Ban Permanently"
              variant="destructive"
              onConfirm={() => onAction('ban', post.id)}
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--admin-on-surface-muted)] text-center">Read-only access for this moderation queue.</p>
        )}
      </div>
    </div>
  );
};
