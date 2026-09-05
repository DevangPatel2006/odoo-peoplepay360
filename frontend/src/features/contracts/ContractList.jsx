import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Input, Select, Modal, Pagination, EmptyState, Spinner, Alert } from '../../components/ui';
import { ContractForm } from './ContractForm';
import { Plus, Search, FileText, CheckCircle2, Clock, Eye, Edit, Trash2, Calendar } from 'lucide-react';
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

  const initialContracts = [
    {
      id: 'CNT-101',
      contractName: 'CNT-101',
      employeeName: 'Alexander Wright',
      employeeId: 'EMP-101',
      startDate: '2023-01-15',
      endDate: 'Ongoing (No End Date)',
      wage: '8500',
      formattedWage: '$8,500.00 / mo',
      salaryStructure: 'Standard Software Engineer Structure',
      workingSchedule: 'Standard 40h/week',
      status: 'Running', // Active
      isCurrentActive: true,
    },
    {
      id: 'CNT-102',
      contractName: 'CNT-102',
      employeeName: 'Sophia Martinez',
      employeeId: 'EMP-102',
      startDate: '2023-04-10',
      endDate: 'Ongoing',
      wage: '6200',
      formattedWage: '$6,200.00 / mo',
      salaryStructure: 'HR & Administrative Structure',
      workingSchedule: 'Standard 40h/week',
      status: 'Running',
      isCurrentActive: true,
    },
    {
      id: 'CNT-103',
      contractName: 'CNT-103',
      employeeName: 'Marcus Vance',
      employeeId: 'EMP-103',
      startDate: '2022-09-01',
      endDate: 'Ongoing',
      wage: '7100',
      formattedWage: '$7,100.00 / mo',
      salaryStructure: 'Finance & Accounting Structure',
      workingSchedule: 'Standard 40h/week',
      status: 'Running',
      isCurrentActive: true,
    },
    {
      id: 'CNT-100-HIST',
      contractName: 'CNT-100-HIST',
      employeeName: 'Alexander Wright',
      employeeId: 'EMP-101',
      startDate: '2022-01-15',
      endDate: '2023-01-14',
      wage: '7200',
      formattedWage: '$7,200.00 / mo',
      salaryStructure: 'Junior Developer Structure',
      workingSchedule: 'Standard 40h/week',
      status: 'Expired', // Historical
      isCurrentActive: false,
    },
    {
      id: 'CNT-104-DRAFT',
      contractName: 'CNT-104-DRAFT',
      employeeName: 'Elena Rostova',
      employeeId: 'EMP-104',
      startDate: '2026-10-01',
      endDate: 'Ongoing',
      wage: '9500',
      formattedWage: '$9,500.00 / mo',
      salaryStructure: 'Executive Management Structure',
      workingSchedule: 'Standard 40h/week',
      status: 'Draft',
      isCurrentActive: false,
    },
  ];

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/contracts');
      if (response.data && Array.isArray(response.data)) {
        setContracts(response.data);
      } else {
        setContracts(initialContracts);
      }
    } catch (err) {
      setContracts(initialContracts);
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
    if (editingContract) {
      setContracts((prev) => prev.map((c) => (c.id === savedData.id ? savedData : c)));
      addToast(`Updated contract ${savedData.contractName}`, 'success');
    } else {
      setContracts((prev) => [savedData, ...prev]);
      addToast(`Created new contract ${savedData.contractName}`, 'success');
    }
    setIsFormModalOpen(false);
    setEditingContract(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      addToast(`Deleted contract record ${deleteTarget.contractName}`, 'info');
      setDeleteTarget(null);
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
