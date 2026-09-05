import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Pagination, EmptyState, Spinner, Alert, Select, ConfirmModal } from '../../components/ui';
import { RequestForm } from './RequestForm';
import { Plus, Search, Calendar, Check, X, Eye, RefreshCw } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const RequestList = ({ onRefreshBalances }) => {
  const { user, addToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmActionState, setConfirmActionState] = useState(null); // { id, newStatus, employeeName }
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Permission check: admins, managers, HR can approve/refuse
  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || ''];
  const canApproveOrRefuse = userRoles.some((r) => 
    ['admin', 'Administrator', 'HR Manager', 'hr_manager', 'payroll_officer'].includes(String(r).toLowerCase())
  );

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/time-off/requests');
      const list = response.data?.data || [];
      setRequests(list);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setError(err.response?.data?.error?.message || 'Failed to load time off requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = (id, newStatus, employeeName) => {
    setConfirmActionState({ id, newStatus, employeeName });
  };

  const confirmAction = async () => {
    if (!confirmActionState) return;
    const { id, newStatus, employeeName } = confirmActionState;
    setActionLoading(true);

    try {
      if (newStatus === 'Approved') {
        await axiosClient.patch(`/time-off/requests/${id}/approve`);
        addToast(`Leave request #${id} for ${employeeName || 'employee'} approved.`, 'success');
      } else {
        await axiosClient.patch(`/time-off/requests/${id}/refuse`);
        addToast(`Leave request #${id} for ${employeeName || 'employee'} refused.`, 'info');
      }

      await fetchRequests();
      if (onRefreshBalances) onRefreshBalances();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err) {
      console.error(`Failed to ${newStatus.toLowerCase()} request:`, err);
      addToast(err.response?.data?.error?.message || `Failed to ${newStatus.toLowerCase()} leave request.`, 'error');
    } finally {
      setActionLoading(false);
      setConfirmActionState(null);
    }
  };

  const mapRequest = (r) => {
    const empName = `${r.employee_first_name || r.first_name || ''} ${r.employee_last_name || r.last_name || ''}`.trim() || 'Employee';
    const empCode = r.employee_code || (r.employee_id ? `EMP-${r.employee_id}` : 'N/A');
    const typeName = r.time_off_type_name || r.leaveType || 'Leave';
    const start = r.start_date ? String(r.start_date).slice(0, 10) : '';
    const end = r.end_date ? String(r.end_date).slice(0, 10) : '';
    const period = start ? `${start} to ${end}` : 'N/A';
    const durationStr = `${r.duration} day${parseFloat(r.duration) !== 1 ? 's' : ''}`;

    return {
      ...r,
      empName,
      empCode,
      typeName,
      period,
      durationStr,
    };
  };

  const mappedRequests = requests.map(mapRequest);

  const filteredRequests = mappedRequests.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.empName.toLowerCase().includes(query) ||
      r.typeName.toLowerCase().includes(query) ||
      String(r.id).includes(query);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* FILTER & SEARCH CONTROLS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search employee or leave type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="To Approve">To Approve</option>
            <option value="Approved">Approved</option>
            <option value="Refused">Refused</option>
            <option value="Draft">Draft</option>
          </Select>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchRequests} loading={loading}>
            Refresh
          </Button>

          <Button variant="accent" size="sm" icon={Plus} onClick={() => setIsFormModalOpen(true)}>
            Request Leave
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : paginatedRequests.length === 0 ? (
        <EmptyState 
          title="No Leave Requests Found" 
          description={searchQuery ? "No requests match your current search criteria." : "No time off requests have been logged yet."} 
        />
      ) : (
        <Table headers={['Employee', 'Leave Type', 'Period', 'Duration', 'Reason', 'Status', 'Actions']}>
          {paginatedRequests.map((r) => {
            const isApproved = r.status === 'Approved';
            const isToApprove = r.status === 'To Approve' || r.status === 'Draft' || r.status === 'Pending';
            const isRefused = r.status === 'Refused';

            const badgeVariant = isApproved ? 'success' : isToApprove ? 'warning' : 'danger';

            return (
              <tr key={r.id}>
                <td>
                  <strong style={{ color: '#0F172A' }}>{r.empName}</strong>
                  <div className="text-xs text-muted">ID: {r.empCode} • Req #{r.id}</div>
                </td>
                <td><span className="text-sm font-semibold">{r.typeName}</span></td>
                <td><span className="text-xs text-secondary">{r.period}</span></td>
                <td><span className="text-sm font-medium">{r.durationStr}</span></td>
                <td>
                  <span className="text-xs text-muted" style={{ maxWidth: '180px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.reason || 'No reason provided'}
                  </span>
                </td>
                <td>
                  <Badge variant={badgeVariant} dot>
                    {r.status}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      icon={Eye} 
                      onClick={() => { setSelectedRequest(r); setIsDetailModalOpen(true); }}
                    >
                      View
                    </Button>

                    {isToApprove && canApproveOrRefuse && (
                      <>
                        <Button 
                          variant="success" 
                          size="xs" 
                          icon={Check} 
                          onClick={() => handleAction(r.id, 'Approved', r.empName)}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          icon={X} 
                          onClick={() => handleAction(r.id, 'Refused', r.empName)}
                        >
                          Refuse
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* PAGINATION */}
      {filteredRequests.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={filteredRequests.length}
        />
      )}

      {/* SUBMIT REQUEST MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Submit New Leave Request"
      >
        <RequestForm
          onSubmit={() => {
            setIsFormModalOpen(false);
            fetchRequests();
            if (onRefreshBalances) onRefreshBalances();
          }}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* REQUEST DETAIL MODAL */}
      {selectedRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Time Off Request Details: #${selectedRequest.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: selectedRequest.status === 'Approved' ? '#D1FAE5' : selectedRequest.status === 'Refused' ? '#FFE4E6' : '#FEF3C7',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{selectedRequest.typeName}</strong>
                <Badge variant={selectedRequest.status === 'Approved' ? 'success' : selectedRequest.status === 'Refused' ? 'danger' : 'warning'}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Duration: <strong>{selectedRequest.durationStr}</strong> ({selectedRequest.period})
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Employee:</span> <strong>{selectedRequest.empName}</strong></div>
              <div><span className="text-muted">Employee ID:</span> {selectedRequest.empCode}</div>
              <div style={{ gridColumn: '1 / -1' }}><span className="text-muted">Reason:</span> {selectedRequest.reason || 'None provided'}</div>
            </div>

            {(selectedRequest.status === 'To Approve' || selectedRequest.status === 'Draft' || selectedRequest.status === 'Pending') && canApproveOrRefuse && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button 
                  variant="outline" 
                  icon={X}
                  onClick={() => handleAction(selectedRequest.id, 'Refused', selectedRequest.empName)}
                  style={{ color: '#E11D48', borderColor: '#FECDD3' }}
                >
                  Refuse Request
                </Button>
                <Button 
                  variant="accent" 
                  icon={Check}
                  onClick={() => handleAction(selectedRequest.id, 'Approved', selectedRequest.empName)}
                >
                  Approve Request
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmModal
        isOpen={!!confirmActionState}
        onClose={() => setConfirmActionState(null)}
        onConfirm={confirmAction}
        loading={actionLoading}
        title={`${confirmActionState?.newStatus === 'Approved' ? 'Approve' : 'Refuse'} Leave Request`}
        message={`Are you sure you want to ${confirmActionState?.newStatus === 'Approved' ? 'approve' : 'refuse'} leave request #${confirmActionState?.id} for ${confirmActionState?.employeeName}?`}
        confirmText={confirmActionState?.newStatus === 'Approved' ? 'Approve Request' : 'Refuse Request'}
        variant={confirmActionState?.newStatus === 'Approved' ? 'accent' : 'danger'}
      />
    </div>
  );
};

export default RequestList;
