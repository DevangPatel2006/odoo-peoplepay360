import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Pagination, EmptyState, Spinner, Alert, Select, ConfirmModal } from '../../components/ui';
import { RequestForm } from './RequestForm';
import { Plus, Search, Calendar, Check, X, Eye, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';

export const RequestList = ({ userRole = 'admin', onRefreshBalances }) => {
  const { addToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmActionState, setConfirmActionState] = useState(null); // { id, status, employeeName }
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Permission check for Approve/Refuse actions
  const canApproveOrRefuse = userRole === 'admin' || userRole === 'HR Manager' || userRole === 'hr';

  const initialRequests = [
    {
      id: 'REQ-301',
      employeeName: 'Marcus Vance',
      employeeId: 'EMP-103',
      leaveType: 'Paid Vacation Leave',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      duration: '3 days',
      reason: 'Annual family vacation leave',
      status: 'Pending', // Amber
      allocatedDays: 20,
      usedDays: 6,
      remainingDays: 14,
    },
    {
      id: 'REQ-302',
      employeeName: 'Elena Rostova',
      employeeId: 'EMP-104',
      leaveType: 'Sick Leave',
      startDate: '2026-09-05',
      endDate: '2026-09-05',
      duration: '1 day',
      reason: 'Doctor appointment & medical rest',
      status: 'Approved', // Emerald
      allocatedDays: 10,
      usedDays: 5,
      remainingDays: 5,
    },
    {
      id: 'REQ-303',
      employeeName: 'David Chen',
      employeeId: 'EMP-105',
      leaveType: 'Unpaid Leave',
      startDate: '2026-09-14',
      endDate: '2026-09-15',
      duration: '2 days',
      reason: 'Personal urgent matters',
      status: 'Pending', // Amber
      allocatedDays: 0,
      usedDays: 2,
      remainingDays: 0,
    },
    {
      id: 'REQ-304',
      employeeName: 'Sophia Martinez',
      employeeId: 'EMP-102',
      leaveType: 'Paid Vacation Leave',
      startDate: '2026-08-20',
      endDate: '2026-08-22',
      duration: '3 days',
      reason: 'Summer break trip',
      status: 'Refused', // Rose
      allocatedDays: 20,
      usedDays: 3,
      remainingDays: 17,
    },
  ];

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/time-off/requests');
      if (response.data && Array.isArray(response.data)) {
        setRequests(response.data);
      } else {
        setRequests(initialRequests);
      }
    } catch (err) {
      setRequests(initialRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = (id, newStatus, employeeName) => {
    if (!canApproveOrRefuse) return;
    setConfirmActionState({ id, newStatus, employeeName });
  };

  const confirmAction = () => {
    if (!confirmActionState) return;
    const { id, newStatus, employeeName } = confirmActionState;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    addToast(`Leave request ${id} for ${employeeName || 'employee'} has been ${newStatus.toLowerCase()}.`, newStatus === 'Approved' ? 'success' : 'info');
    if (isDetailModalOpen && selectedRequest) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    if (onRefreshBalances) onRefreshBalances();
    setConfirmActionState(null);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        <div style={{ position: 'relative', width: '260px' }}>
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
            <option value="Pending">Pending (Amber)</option>
            <option value="Approved">Approved (Emerald)</option>
            <option value="Refused">Refused (Rose)</option>
          </Select>

          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => setIsFormModalOpen(true)}
          >
            New Request
          </Button>
        </div>
      </div>

      {/* REQUESTS DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : paginatedRequests.length === 0 ? (
        <EmptyState title="No Leave Requests Found" description="There are no leave requests matching your filter." />
      ) : (
        <Table headers={['Employee', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Actions']}>
          {paginatedRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';
            const isRefused = req.status === 'Refused';

            return (
              <tr key={req.id}>
                <td>
                  <strong style={{ color: '#0F172A' }}>{req.employeeName}</strong>
                  <div className="text-xs text-muted">ID: {req.employeeId}</div>
                </td>
                <td><span className="font-medium text-sm">{req.leaveType}</span></td>
                <td>{req.startDate}</td>
                <td>{req.endDate}</td>
                <td><span className="font-semibold text-sm">{req.duration}</span></td>
                <td>
                  {/* Status Color Logic: Pending -> Amber, Approved -> Emerald, Refused -> Rose */}
                  <Badge variant={isApproved ? 'success' : isPending ? 'warning' : 'error'} dot>
                    {req.status}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Eye}
                      onClick={() => { setSelectedRequest(req); setIsDetailModalOpen(true); }}
                    />
                    {isPending && canApproveOrRefuse && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          icon={Check}
                          onClick={() => handleAction(req.id, 'Approved', req.employeeName)}
                          style={{ color: '#059669', borderColor: '#A7F3D0', backgroundColor: '#D1FAE5' }}
                          title="Approve Leave"
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={X}
                          onClick={() => handleAction(req.id, 'Refused', req.employeeName)}
                          style={{ color: '#E11D48', borderColor: '#FECDD3', backgroundColor: '#FFE4E6' }}
                          title="Refuse Leave"
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
          onSubmit={(newReq) => {
            setRequests((prev) => [newReq, ...prev]);
            setIsFormModalOpen(false);
            addToast(`Submitted leave request ${newReq.id}`, 'success');
          }}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* REQUEST DETAIL MODAL */}
      {selectedRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Time Off Request Details: ${selectedRequest.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: selectedRequest.status === 'Approved' ? '#D1FAE5' : selectedRequest.status === 'Pending' ? '#FEF3C7' : '#FFE4E6',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{selectedRequest.leaveType}</strong>
                <Badge variant={selectedRequest.status === 'Approved' ? 'success' : selectedRequest.status === 'Pending' ? 'warning' : 'error'}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                Duration: <strong>{selectedRequest.duration}</strong> ({selectedRequest.startDate} to {selectedRequest.endDate})
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Employee:</span> <strong>{selectedRequest.employeeName}</strong></div>
              <div><span className="text-muted">Reason:</span> {selectedRequest.reason}</div>
            </div>

            {/* BALANCE SNAPSHOT FROM EXISTING APPLICATION DATA */}
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div className="text-xs font-semibold text-secondary" style={{ marginBottom: '8px' }}>Leave Allocation Balance Snapshot</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div className="text-xs text-muted">Allocated</div>
                  <div className="font-bold">{selectedRequest.allocatedDays || 20} days</div>
                </div>
                <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div className="text-xs text-muted">Used</div>
                  <div className="font-bold text-secondary">{selectedRequest.usedDays || 6} days</div>
                </div>
                <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div className="text-xs text-muted">Remaining</div>
                  <div className="font-bold text-success">{selectedRequest.remainingDays || 14} days</div>
                </div>
              </div>
            </div>

            {/* ACTIONS IF ALLOWED BY ROLE */}
            {selectedRequest.status === 'Pending' && canApproveOrRefuse && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button 
                  variant="outline" 
                  icon={X}
                  onClick={() => handleAction(selectedRequest.id, 'Refused', selectedRequest.employeeName)}
                  style={{ color: '#E11D48', borderColor: '#FECDD3' }}
                >
                  Refuse Request
                </Button>
                <Button 
                  variant="accent" 
                  icon={Check}
                  onClick={() => handleAction(selectedRequest.id, 'Approved', selectedRequest.employeeName)}
                >
                  Approve Request
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG FOR LEAVE APPROVAL/REFUSAL */}
      <ConfirmModal
        isOpen={!!confirmActionState}
        onClose={() => setConfirmActionState(null)}
        onConfirm={confirmAction}
        title={`${confirmActionState?.newStatus === 'Approved' ? 'Approve' : 'Refuse'} Leave Request`}
        message={`Are you sure you want to ${confirmActionState?.newStatus === 'Approved' ? 'approve' : 'refuse'} the leave request ${confirmActionState?.id} for ${confirmActionState?.employeeName}?`}
        confirmText={confirmActionState?.newStatus === 'Approved' ? 'Approve Request' : 'Refuse Request'}
        variant={confirmActionState?.newStatus === 'Approved' ? 'accent' : 'danger'}
      />
    </div>
  );
};
