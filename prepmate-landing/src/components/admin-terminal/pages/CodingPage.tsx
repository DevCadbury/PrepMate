import React, { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchCodingProblems, updateCodingProblem, deleteCodingProblem } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { CodingProblem } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Check, X, Trash2, Edit } from 'lucide-react';
import { useAdminContext } from '../contexts/AdminContext';

export const CodingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const { hasPermission } = useAdminContext();
  const canModerateCoding = hasPermission('admin.coding.moderate');
  const canDeleteCoding = hasPermission('admin.coding.delete');

  const { data, loading, refetch } = useAdminData(
    fetchCodingProblems, 
    { page, limit: 10, search, status: statusFilter },
    [page, search, statusFilter]
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateCodingProblem(id, { approvalStatus: newStatus });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    {
      header: 'Problem Title',
      accessorKey: 'title' as keyof CodingProblem,
      width: '40%',
      cell: (prob: CodingProblem) => (
        <div>
          <p className="font-medium text-[var(--admin-on-surface)] truncate max-w-[250px]">{prob.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {prob.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[var(--admin-surface-container-highest)] text-[var(--admin-on-surface-variant)] rounded border border-[var(--admin-outline)]">
                {tag}
              </span>
            ))}
            {prob.tags && prob.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-[var(--admin-on-surface-muted)]">+{prob.tags.length - 3}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Difficulty',
      accessorKey: 'difficulty' as keyof CodingProblem,
      width: '15%',
      cell: (prob: CodingProblem) => {
        const color = prob.difficulty === 'easy' ? 'text-emerald-500' : 
                      prob.difficulty === 'medium' ? 'text-amber-500' : 'text-rose-500';
        return <span className={`font-semibold capitalize text-xs ${color}`}>{prob.difficulty}</span>;
      }
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof CodingProblem,
      width: '15%',
      cell: (prob: CodingProblem) => (
        <span className={`admin-badge ${
          prob.status === 'approved' ? 'admin-badge-success' : 
          prob.status === 'rejected' ? 'admin-badge-error' : 'admin-badge-warning'
        }`}>
          {prob.status || 'pending'}
        </span>
      )
    },
    {
      header: 'Actions',
      width: '30%',
      cell: (prob: CodingProblem) => (
        <div className="flex items-center space-x-2">
          {canModerateCoding && (!prob.status || prob.status === 'pending') && (
            <>
              <ConfirmDialog 
                trigger={
                  <button className="p-1 px-2 border border-[var(--admin-outline)] hover:border-emerald-500/30 text-[var(--admin-on-surface-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors text-xs font-semibold flex items-center">
                    <Check size={14} className="mr-1" /> Approve
                  </button>
                }
                title="Approve Problem?"
                description="This will make the coding problem public for all users."
                actionText="Approve"
                onConfirm={() => handleStatusChange(prob.id, 'approved')}
              />
              <ConfirmDialog 
                trigger={
                  <button className="p-1 px-2 border border-[var(--admin-outline)] hover:border-rose-500/30 text-[var(--admin-on-surface-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors text-xs font-semibold flex items-center">
                    <X size={14} className="mr-1" /> Reject
                  </button>
                }
                title="Reject Problem?"
                description="This will flag the problem as rejected, hiding it from the public list."
                variant="destructive"
                actionText="Reject"
                onConfirm={() => handleStatusChange(prob.id, 'rejected')}
              />
            </>
          )}

          {canModerateCoding && (
            <button className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-[var(--admin-primary)] transition-colors" title="Edit Problem">
              <Edit size={16} />
            </button>
          )}
          
          {canDeleteCoding && (
             <ConfirmDialog 
               trigger={
                 <button className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-[var(--admin-error)] transition-colors" title="Delete Problem">
                   <Trash2 size={16} />
                 </button>
               }
               title="Delete Problem?"
               description="This will permanently delete the problem and all associated submissions."
               actionText="Delete Permanently"
               variant="destructive"
               onConfirm={async () => {
                 await deleteCodingProblem(prob.id);
                 refetch();
               }}
             />
          )}

        </div>
      )
    }
  ];

  const filters = (
    <select 
      value={statusFilter} 
      onChange={(e) => setStatusFilter(e.target.value)}
      className="admin-input py-1.5 text-sm w-32"
    >
      <option value="">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1">Coding Catalog</h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Manage programming challenges and user submissions.</p>
        </div>
        {canModerateCoding && (
          <button className="px-4 py-2 bg-[var(--admin-primary)] text-white rounded-md hover:bg-[var(--admin-primary-hover)] text-sm font-medium transition-colors">
            Create Problem
          </button>
        )}
      </div>

      <DataTable 
        columns={columns}
        data={data?.problems || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        isLoading={loading}
        filters={filters}
        searchPlaceholder="Search by title or tags..."
      />
    </div>
  );
};

export default CodingPage;
