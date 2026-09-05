import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Input, Select, Modal, Pagination, EmptyState, Spinner, Alert } from '../../components/ui';
import { ContractForm } from './ContractForm';
import { Plus, Search, FileText, CheckCircle2, Clock, Eye, Edit, Trash2, Calendar, Play } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';
import { ConfirmModal } from '../../components/ui';

export const ContractList = () => {
  const { addToast } = useApp();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const mapContract = (c) => ({
    ...c,
    id: `CNT-${c.id}`,
    dbId: c.id,
    contractName: c.contract_number || c.contract_name || c.contractName || `CNT-${c.id}`,
    employeeName: c.employeeName || `${c.employee_first_name || ''} ${c.employee_last_name || ''}`.trim() || 'Employee',
    employeeId: c.employeeId || c.employee_code || `EMP-${c.employee_id}`,
    startDate: c.startDate || (c.start_date ? String(c.start_date).split('T')[0] : (c.date_start ? String(c.date_start).split('T')[0] : '')),
    endDate: c.endDate || (c.end_date ? String(c.end_date).split('T')[0] : (c.date_end ? String(c.date_end).split('T')[0] : 'Ongoing')),
    wage: c.wage || c.wage_per_month || '0',
    formattedWage: c.formattedWage || `$${parseFloat(c.wage_per_month || c.wage || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo`,
    salaryStructure: c.salaryStructure || c.salary_structure_name || 'Standard Salary Structure',
    workingSchedule: c.workingSchedule || c.working_schedule_name || 'Standard 40h/week',
    status: c.status || 'Draft',
    isCurrentActive: c.status === 'Running',
  });

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/contracts');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setContracts(list.map(mapContract));
    } catch (err) {
      console.error('Failed to load contracts:', err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((cnt) => {
    const matchesSearch =
      cnt.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cnt.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cnt.salaryStructure.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || cnt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage) || 1;
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSaveContract = (savedData) => {
    fetchContracts();
    setIsFormModalOpen(false);
    setEditingContract(null);
    const contractNum = savedData?.contract_number || savedData?.contractName || 'contract';
    addToast(
      editingContract
        ? `Updated contract ${contractNum}`
        : `Created new contract ${contractNum}`,
      'success'
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/contracts/${deleteTarget.dbId || deleteTarget.id}`);
      addToast(`Deleted contract record ${deleteTarget.contractName || deleteTarget.contract_number}`, 'info');
      setDeleteTarget(null);
      fetchContracts();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to delete contract.', 'error');
    }
  };

  const handleActivateContract = async (cnt) => {
    try {
      await axiosClient.post(`/contracts/${cnt.dbId || cnt.id}/activate`);
      addToast(`Activated contract ${cnt.contractName || cnt.contract_number}. Status is now Running.`, 'success');
      fetchContracts();
      if (selectedContract && (selectedContract.dbId === cnt.dbId || selectedContract.id === cnt.id)) {
        setIsDetailModalOpen(false);
        setSelectedContract(null);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to activate contract.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Employee Contracts & Wage Terms</h1>
          <p className="page-description">
            Track running contracts, historical wage changes, and contract resolver bindings for payroll processing.
          </p>
        </div>
        <div className="page-actions">
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => {
              setEditingContract(null);
              setIsFormModalOpen(true);
            }}
          >
            Create New Contract
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
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
        <div style={{ position: 'relative', width: '280px', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search employee, contract ID, structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Contract Status</option>
            <option value="Running">Running (Active)</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired (Historical)</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>Loading contract records...</p>
        </div>
      ) : paginatedContracts.length === 0 ? (
        <EmptyState
          title="No Contracts Found"
          description="There are no contract records matching your search criteria."
          action={
            <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
              Clear Search
            </Button>
          }
        />
      ) : (
        <Table headers={['Employee', 'Contract Ref', 'Start Date', 'End Date', 'Monthly Salary', 'Schedule', 'Salary Structure', 'Status', 'Actions']}>
          {paginatedContracts.map((cnt) => {
            const isRunning = cnt.status === 'Running';
            const isExpired = cnt.status === 'Expired';
            const isDraft = cnt.status === 'Draft';

            return (
              <tr 
                key={cnt.id} 
                style={{ 
                  backgroundColor: isExpired ? '#FAFAFA' : '#FFFFFF',
                  opacity: isExpired ? 0.85 : 1 
                }}
              >
                <td>
                  <strong style={{ color: '#0F172A' }}>{cnt.employeeName}</strong>
                  <div className="text-xs text-muted">ID: {cnt.employeeId}</div>
                </td>
                <td><span className="font-mono text-sm font-semibold">{cnt.contractName}</span></td>
                <td>{cnt.startDate}</td>
                <td>{cnt.endDate || 'Ongoing'}</td>
                <td><strong style={{ color: '#059669' }}>{cnt.formattedWage || `$${Number(cnt.wage).toLocaleString()}/mo`}</strong></td>
                <td><span className="text-xs">{cnt.workingSchedule}</span></td>
                <td><span className="text-xs text-secondary">{cnt.salaryStructure}</span></td>
                <td>
                  <Badge variant={isRunning ? 'success' : isDraft ? 'warning' : isExpired ? 'neutral' : 'error'} dot>
                    {cnt.status} {isExpired ? '(Historical)' : ''}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isDraft && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Play}
                        title="Activate Contract"
                        onClick={() => handleActivateContract(cnt)}
                        style={{ color: '#059669' }}
                      />
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Eye}
                      onClick={() => { setSelectedContract(cnt); setIsDetailModalOpen(true); }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Edit}
                      onClick={() => { setEditingContract(cnt); setIsFormModalOpen(true); }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => setDeleteTarget(cnt)}
                      style={{ color: '#E11D48' }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* PAGINATION */}
      {filteredContracts.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={filteredContracts.length}
        />
      )}

      {/* CREATE / EDIT CONTRACT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingContract(null); }}
        size="lg"
        title={editingContract ? `Edit Contract: ${editingContract.contractName}` : 'Create New Contract'}
      >
        <ContractForm
          contract={editingContract}
          onSave={handleSaveContract}
          onCancel={() => { setIsFormModalOpen(false); setEditingContract(null); }}
        />
      </Modal>

      {/* CONTRACT DETAIL MODAL */}
      {selectedContract && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Contract Master Details: ${selectedContract.contractName}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedContract.status === 'Draft' && (
                <Button 
                  variant="accent" 
                  icon={Play}
                  onClick={() => handleActivateContract(selectedContract)}
                >
                  Activate Contract
                </Button>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: selectedContract.status === 'Running' ? '#D1FAE5' : '#F1F5F9',
              borderRadius: '10px',
              border: `1px solid ${selectedContract.status === 'Running' ? '#A7F3D0' : '#E2E8F0'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: selectedContract.status === 'Running' ? '#065F46' : '#475569' }}>
                  {selectedContract.status === 'Running' ? 'Active Running Contract' : `${selectedContract.status} Contract`}
                </strong>
                <Badge variant={selectedContract.status === 'Running' ? 'success' : 'neutral'}>
                  {selectedContract.status}
                </Badge>
              </div>
              <p className="text-xs" style={{ marginTop: '4px', color: '#64748B' }}>
                Bound to Payrun Resolver Engine for automated wage evaluation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Employee:</span> <strong>{selectedContract.employeeName}</strong></div>
              <div><span className="text-muted">Wage:</span> <strong className="text-success">{selectedContract.formattedWage}</strong></div>
              <div><span className="text-muted">Start Date:</span> {selectedContract.startDate}</div>
              <div><span className="text-muted">End Date:</span> {selectedContract.endDate || 'Ongoing'}</div>
              <div><span className="text-muted">Structure:</span> {selectedContract.salaryStructure}</div>
              <div><span className="text-muted">Schedule:</span> {selectedContract.workingSchedule}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION DIALOG FOR CONTRACT DELETION */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Contract Record"
        message={`Are you sure you want to delete the contract record ${deleteTarget?.contractName} for ${deleteTarget?.employeeName}? This action cannot be undone.`}
        confirmText="Delete Contract"
        variant="danger"
      />
    </div>
  );
};

export default ContractList;
