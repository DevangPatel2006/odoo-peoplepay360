import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Spinner, Alert, EmptyState } from '../../components/ui';
import { Plus, Check, X, Calendar, RefreshCw } from 'lucide-react';
import { AllocationForm } from './AllocationForm';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const AllocationList = ({ onRefreshBalances }) => {
  const { addToast } = useApp();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/time-off/allocations');
      const list = Array.isArray(response.data) ? response.data : [];
      setAllocations(list);
    } catch (err) {
      console.error('Failed to load allocations:', err);
      setError(err.response?.data?.error?.message || 'Failed to load allocations.');
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await axiosClient.patch(`/time-off/allocations/${id}/approve`);
      addToast('Allocation approved successfully!', 'success');
      fetchAllocations();
      if (onRefreshBalances) onRefreshBalances();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to approve allocation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefuse = async (id) => {
    setActionLoadingId(id);
    try {
      await axiosClient.patch(`/time-off/allocations/${id}/refuse`);
      addToast('Allocation refused.', 'info');
      fetchAllocations();
      if (onRefreshBalances) onRefreshBalances();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to refuse allocation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Employee Quota Allocations</h4>
          <p className="text-xs text-secondary">Annual allowances and credited balances per time off type.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAllocations} loading={loading}>
            Refresh
          </Button>
          <Button variant="accent" size="sm" icon={Plus} onClick={() => setIsFormOpen(true)}>
            Grant Allocation
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : allocations.length === 0 ? (
        <EmptyState 
          title="No Allocations Found" 
          description="Grant an employee a time off allocation allowance to enable leave requests." 
        />
      ) : (
        <Table headers={['Employee', 'Leave Type', 'Allocated', 'Used', 'Remaining Balance', 'Validity Period', 'Status', 'Actions']}>
          {allocations.map((alloc) => {
            const empName = `${alloc.employee_first_name || ''} ${alloc.employee_last_name || ''}`.trim() || 'Employee';
            const empCode = alloc.employee_code || (alloc.employee_id ? `EMP-${alloc.employee_id}` : '');
            const allocAmt = parseFloat(alloc.allocated_amount || 0);
            const takenAmt = parseFloat(alloc.taken_amount || 0);
            const remAmt = parseFloat(alloc.remaining_amount ?? (allocAmt - takenAmt));
            const start = alloc.validity_start ? String(alloc.validity_start).slice(0, 10) : '';
            const end = alloc.validity_end ? String(alloc.validity_end).slice(0, 10) : '';
            const validity = start ? `${start} to ${end}` : 'Ongoing';

            const isApproved = alloc.status === 'Approved';
            const isToApprove = alloc.status === 'To Approve' || alloc.status === 'Draft';

            return (
              <tr key={alloc.id}>
                <td>
                  <strong style={{ color: '#0F172A' }}>{empName}</strong>
                  <div className="text-xs text-muted">ID: {empCode}</div>
                </td>
                <td><span className="text-sm font-medium">{alloc.time_off_type_name || 'Paid Time Off'}</span></td>
                <td><span className="font-semibold text-sm">{allocAmt} days</span></td>
                <td><span className="text-sm text-secondary">{takenAmt} days</span></td>
                <td>
                  <strong className={remAmt > 0 ? "text-success" : "text-secondary"} style={{ fontSize: '0.95rem' }}>
                    {remAmt} days remaining
                  </strong>
                </td>
                <td><span className="text-xs text-secondary">{validity}</span></td>
                <td>
                  <Badge variant={isApproved ? 'success' : isToApprove ? 'warning' : 'danger'}>
                    {alloc.status}
                  </Badge>
                </td>
                <td>
                  {isToApprove ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button 
                        size="xs" 
                        variant="success" 
                        icon={Check}
                        loading={actionLoadingId === alloc.id}
                        onClick={() => handleApprove(alloc.id)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="xs" 
                        variant="outline" 
                        icon={X}
                        loading={actionLoadingId === alloc.id}
                        onClick={() => handleRefuse(alloc.id)}
                      >
                        Refuse
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <AllocationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={() => {
          setIsFormOpen(false);
          fetchAllocations();
          if (onRefreshBalances) onRefreshBalances();
        }}
      />
    </div>
  );
};

export default AllocationList;
