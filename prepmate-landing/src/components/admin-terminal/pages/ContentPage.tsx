import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchPosts, fetchChatReports, moderatePost, reviewChatReport } from '../services/adminApi';
import { ReportCard } from '../components/ReportCard';
import { CaseContextPanel } from '../components/CaseContextPanel';
import { ContentPost } from '../types';
import { useAdminContext } from '../contexts/AdminContext';

export const ContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'chats'>('posts');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { hasPermission } = useAdminContext();
  const canModerate = hasPermission(['admin.content.moderate', 'admin.chatreports.moderate'], 'any');
  
  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = useAdminData(
    fetchPosts, 
    { page: 1, limit: 20, reportedOnly: true },
    [activeTab] // refetch on tab change just in case
  );

  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useAdminData(
    fetchChatReports,
    { page: 1, limit: 20, status: 'open' },
    [activeTab]
  );

  const chatPosts = React.useMemo<ContentPost[]>(() => {
    const reports = chatsData?.reports || [];
    return reports.map((report) => ({
      id: report.messageId,
      type: 'chat',
      status: report.status,
      contentPreview: report.messagePreview,
      tags: ['chat_report'],
      reportsCount: report.reportCount,
      pendingReportsCount: report.status === 'open' ? report.reportCount : 0,
      latestReportReason: report.lastReason,
      createdAt: report.lastReportedAt,
      user: report.sender
        ? {
            id: report.sender.id,
            name: report.sender.name,
            username: report.sender.username,
            profilePicture: report.sender.profilePicture,
          }
        : null,
    }));
  }, [chatsData]);

  const activeItems = React.useMemo(() => {
    const base = activeTab === 'posts' ? postsData?.posts || [] : chatPosts;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return base;

    return base.filter((item) => {
      const values = [
        item.contentPreview,
        item.latestReportReason,
        item.user?.name,
        item.user?.username,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return values.includes(query);
    });
  }, [activeTab, postsData, chatPosts, searchQuery]);

  const selectedPost = React.useMemo(() => {
    if (!selectedCaseId) return null;
    return activeItems.find((item) => item.id === selectedCaseId) || null;
  }, [selectedCaseId, activeItems]);

  // Auto-select first case if none selected
  useEffect(() => {
    if (!selectedCaseId && activeItems.length > 0) {
      setSelectedCaseId(activeItems[0].id);
    }
    if (selectedCaseId && !activeItems.find((item) => item.id === selectedCaseId)) {
      setSelectedCaseId(activeItems[0]?.id || null);
    }
  }, [activeItems, selectedCaseId]);

  useEffect(() => {
    setSelectedCaseId(null);
  }, [activeTab]);

  const handleAction = async (action: string, id: string) => {
    try {
      if (activeTab === 'posts') {
        if (action === 'approve') {
          await moderatePost(id, 'approved', 'Cleared by admin');
        } else if (action === 'remove') {
          await moderatePost(id, 'rejected', 'Removed by admin');
        } else if (action === 'timeout') {
          await moderatePost(id, 'hidden', 'Temporarily hidden after moderator timeout decision');
        } else if (action === 'ban') {
          await moderatePost(id, 'removed', 'Removed due to repeated abuse');
        }

        refetchPosts();
      } else {
        if (action === 'approve') {
          await reviewChatReport(id, 'dismissed', 'Dismissed after moderation review');
        } else if (action === 'remove' || action === 'ban') {
          await reviewChatReport(id, 'blocked', 'Blocked by moderator');
        } else {
          await reviewChatReport(id, 'resolved', 'Resolved with warning');
        }

        refetchChats();
      }

      if (selectedCaseId === id) setSelectedCaseId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-fade-in bg-[var(--admin-surface)]">
      {/* Left List Pane */}
      <div className="w-full lg:w-7/12 flex flex-col border-r border-[var(--admin-outline)] bg-[var(--admin-surface)] z-10">
        
        <div className="p-6 pb-2 shrink-0">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1">Content Moderation</h1>
              <p className="text-[var(--admin-on-surface-muted)] text-sm">Review flagged content and user reports.</p>
            </div>
            <div className="flex space-x-2 bg-[var(--admin-surface-container)] rounded-md border border-[var(--admin-outline)] p-1">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'posts' ? 'bg-[var(--admin-outline)] text-[var(--admin-on-surface)]' : 'text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-on-surface)]'}`}
              >
                Public Posts
              </button>
              <button 
                onClick={() => setActiveTab('chats')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'chats' ? 'bg-[var(--admin-outline)] text-[var(--admin-on-surface)]' : 'text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-on-surface)]'}`}
              >
                Private Chats
                <span className="ml-1.5 px-1.5 bg-[var(--admin-error)] text-white text-[10px] rounded-full">
                  {chatPosts.length}
                </span>
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-on-surface-muted)]" />
            <input 
              type="text" 
              placeholder={`Search pending ${activeTab}...`} 
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="admin-input w-full pl-9 h-10 shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto admin-terminal scrollbar-thin px-6 pb-6">
          {(activeTab === 'posts' ? postsLoading : chatsLoading) ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[var(--admin-surface-container)] rounded-lg animate-pulse border border-[var(--admin-outline)]"></div>)}
            </div>
          ) : activeItems.length > 0 ? (
            <div className="space-y-4 pb-20">
              {activeItems.map((post) => (
                <div key={post.id} className="transition-transform duration-200">
                  <ReportCard 
                    post={post} 
                    onAction={handleAction} 
                    canModerate={canModerate}
                    isActive={selectedCaseId === post.id}
                    onClick={() => setSelectedCaseId(post.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--admin-surface-container)] flex items-center justify-center mb-4 border border-[var(--admin-outline)] shadow-inner">
                <ShieldCheck size={32} className="text-[var(--admin-success)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--admin-on-surface)] mb-1">Queue is empty</h3>
              <p className="text-[var(--admin-on-surface-muted)] max-w-sm">
                No pending reports found for {activeTab}. Great job keeping the community safe.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Context Pane */}
      <div className="hidden lg:block w-5/12 bg-[var(--admin-surface)] p-6 z-0 overflow-y-auto">
        <CaseContextPanel post={selectedPost} onAction={handleAction} canModerate={canModerate} />
      </div>
    </div>
  );
};

export default ContentPage;
