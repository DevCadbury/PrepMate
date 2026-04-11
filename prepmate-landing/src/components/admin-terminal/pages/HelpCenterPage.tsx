import React, { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchSupportTickets, updateSupportTicket } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { SupportTicket } from '../types';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { useAdminContext } from '../contexts/AdminContext';

export const HelpCenterPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { hasPermission } = useAdminContext();

  const canManageTickets = hasPermission('admin.help.manage');

  const { data, loading, refetch } = useAdminData(
    fetchSupportTickets, 
    { page, limit: 12, search, status: statusFilter, category: categoryFilter },
    [page, search, statusFilter, categoryFilter]
  );

  const columns = [
    {
      header: 'Ticket & User',
      accessorKey: 'subject' as keyof SupportTicket,
      width: '40%',
      cell: (ticket: SupportTicket) => (
        <div>
          <p className="font-medium text-[var(--admin-on-surface)] truncate max-w-[250px]">{ticket.subject}</p>
          <div className="flex items-center mt-1 space-x-2 text-xs text-[var(--admin-on-surface-muted)]">
            <span>#{ticket.id.slice(-6)}</span>
            <span>•</span>
            <span>{ticket.user?.name || 'Unknown User'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category' as keyof SupportTicket,
      width: '15%',
      cell: (ticket: SupportTicket) => (
        <span className="text-xs font-medium text-[var(--admin-on-surface-variant)] uppercase tracking-wider bg-[var(--admin-surface-container-highest)] px-2 py-1 rounded">
          {ticket.category.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Priority',
      accessorKey: 'priority' as keyof SupportTicket,
      width: '15%',
      cell: (ticket: SupportTicket) => {
        const pColor = ticket.priority === 'high' ? 'text-rose-500' : ticket.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500';
        return <span className={`text-xs font-bold uppercase ${pColor}`}>{ticket.priority}</span>;
      }
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof SupportTicket,
      width: '15%',
      cell: (ticket: SupportTicket) => (
        <span className={`admin-badge ${
          ticket.status === 'open' ? 'admin-badge-warning' : 
          ticket.status === 'resolved' ? 'admin-badge-success' : 'admin-badge-neutral'
        }`}>
          {ticket.status}
        </span>
      )
    },
    {
      header: 'Actions',
      width: '15%',
      cell: (ticket: SupportTicket) => (
        <div className="flex space-x-2">
          {canManageTickets && ticket.status === 'open' && (
            <button
              className="px-2 py-1 text-xs rounded border border-[var(--admin-outline)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-primary)] hover:border-[var(--admin-primary)] transition-colors"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateSupportTicket(ticket.id, { status: 'in_progress' });
                  refetch();
                } catch (error) {
                  console.error('Failed to move ticket to in_progress:', error);
                }
              }}
            >
              Take
            </button>
          )}

          {canManageTickets && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              className="px-2 py-1 text-xs rounded border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateSupportTicket(ticket.id, { status: 'resolved' });
                  refetch();
                } catch (error) {
                  console.error('Failed to resolve ticket:', error);
                }
              }}
            >
              Resolve
            </button>
          )}

          <button className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-[var(--admin-primary)] transition-colors" title="View/Reply">
            <MessageSquare size={16} />
          </button>
          {ticket.user?.email && (
            <button 
              className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-emerald-500 transition-colors" 
              title="Email Directly"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${ticket.user!.email}?subject=RE: ${ticket.subject}`;
              }}
            >
              <Mail size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const filters = (
    <>
      <select 
        value={categoryFilter} 
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="admin-input py-1.5 text-sm"
      >
        <option value="">All Categories</option>
        <option value="help">Help</option>
        <option value="bug">Bug</option>
        <option value="billing">Billing</option>
        <option value="abuse">Abuse</option>
        <option value="other">Other</option>
      </select>
      <select 
        value={statusFilter} 
        onChange={(e) => setStatusFilter(e.target.value)}
        className="admin-input py-1.5 text-sm w-32"
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
    </>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1 flex items-center">
            <HelpCircle className="mr-2 text-blue-500" /> Support Desk
          </h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Manage user inquiries, bug reports, and support requests.</p>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={data?.tickets || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        isLoading={loading}
        filters={filters}
        searchPlaceholder="Search tickets by ID, subject or user..."
      />
    </div>
  );
};

export default HelpCenterPage;
