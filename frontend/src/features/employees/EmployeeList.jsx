import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Badge, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Pagination, 
  EmptyState, 
  Spinner,
  Dropdown,
  Alert
} from '../../components/ui';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { EmployeeKanban } from './EmployeeKanban';
import { 
  UserPlus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  ArrowUpDown
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';
import { 
  ConfirmModal 
} from '../../components/ui';

export const EmployeeList = () => {
  const { addToast } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('table'); // table | kanban
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const mapEmployee = (e) => ({
    ...e,
    id: e.employee_code || e.employeeId || `EMP-${e.id}`,
    dbId: e.id,
    name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Employee',
    firstName: e.firstName || e.first_name || '',
    lastName: e.lastName || e.last_name || '',
    email: e.email || e.work_email || '',
    department: e.department || e.department_name || 'General Management',
    position: e.position || e.job_position_title || 'Specialist',
    employeeType: e.employeeType || e.employee_type || 'Full-time',
    status: e.status || 'Active',
    manager: e.manager || (e.manager_first_name ? `${e.manager_first_name} ${e.manager_last_name || ''}`.trim() : 'None'),
    hireDate: e.hireDate || (e.date_of_joining ? String(e.date_of_joining).split('T')[0] : ''),
    schedule: e.schedule || e.working_schedule_name || 'Standard 40h/week',
    bankAccount: e.bankAccount || e.bank_account_number || '',
    phone: e.phone || e.personal_phone || '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/employees');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setEmployees(list.map(mapEmployee));
    } catch (err) {
      console.error('Failed to load employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter & Search Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || emp.employeeType === typeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  // Sort Logic
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'id') return a.id.localeCompare(b.id);
    if (sortBy === 'department') return a.department.localeCompare(b.department);
    return 0;
  });

  // Pagination Slice
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSaveEmployee = () => {
    fetchEmployees();
    setIsFormModalOpen(false);
    setEditingEmployee(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/employees/${deleteTarget.dbId || deleteTarget.id}`);
      addToast(`Deleted employee record for ${deleteTarget.name}`, 'info');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee:', err);
      addToast(err.response?.data?.error?.message || 'Failed to delete employee record.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Employee Master Records</h1>
          <p className="page-description">
            Central HR hub for workforce management, employee profiles, department assignments, and contract links.
          </p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: '4px', background: '#FFFFFF', padding: '2px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="sm" 
              icon={ListIcon}
              onClick={() => setViewMode('table')}
            >
              List View
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm" 
              icon={LayoutGrid}
              onClick={() => setViewMode('kanban')}
            >
              Kanban View
            </Button>
          </div>
          <Button 
            variant="primary" 
            icon={UserPlus}
            onClick={() => {
              setEditingEmployee(null);
              setIsFormModalOpen(true);
            }}
          >
            Create Employee
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
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
        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by name, email, position, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Selects */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Departments</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="name">Sort by Name</option>
            <option value="id">Sort by ID</option>
            <option value="department">Sort by Dept</option>
          </Select>
        </div>
      </div>

      {/* CONTENT: DATA TABLE VS KANBAN */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>Loading employee directory...</p>
        </div>
      ) : paginatedEmployees.length === 0 ? (
        <EmptyState
          title="No Employee Records Found"
          description="No employee records match your search filter criteria."
          action={
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setDepartmentFilter('ALL'); setStatusFilter('ALL'); }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'kanban' ? (
        <EmployeeKanban
          employees={paginatedEmployees}
          onSelect={(emp) => {
            setSelectedEmployee(emp);
            setIsDetailModalOpen(true);
          }}
        />
      ) : (
        <Table headers={['Employee', 'Employee ID', 'Department', 'Position', 'Employee Type', 'Status', 'Manager', 'Actions']}>
          {paginatedEmployees.map((emp) => (
            <tr key={emp.id || emp.employeeId}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#172554',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    {emp.name ? emp.name.split(' ').map(n => n[0]).join('') : 'E'}
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#0F172A' }}>{emp.name}</strong>
                    <span className="text-xs text-muted">{emp.email}</span>
                  </div>
                </div>
              </td>
              <td><span className="font-mono text-sm font-semibold">{emp.id || emp.employeeId}</span></td>
              <td>{emp.department}</td>
              <td>{emp.position}</td>
              <td><Badge variant="neutral">{emp.employeeType || 'Full-Time'}</Badge></td>
              <td>
                <Badge variant={emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'error'} dot>
                  {emp.status}
                </Badge>
              </td>
              <td><span className="text-sm">{emp.manager || 'Sarah Jenkins'}</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Eye}
                    title="Central HR Hub"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsDetailModalOpen(true);
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Edit}
                    title="Edit Employee"
                    onClick={() => {
                      setEditingEmployee(emp);
                      setIsFormModalOpen(true);
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Trash2}
                    title="Delete Record"
                    onClick={() => setDeleteTarget(emp)}
                    style={{ color: '#E11D48' }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* PAGINATION */}
      {sortedEmployees.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={sortedEmployees.length}
        />
      )}

      {/* CREATE / EDIT EMPLOYEE FORM MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingEmployee(null); }}
        size="lg"
        title={editingEmployee ? `Edit Employee Record: ${editingEmployee.name}` : 'Create New Employee Record'}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onCancel={() => { setIsFormModalOpen(false); setEditingEmployee(null); }}
        />
      </Modal>

      {/* CENTRAL HR HUB DETAIL MODAL */}
      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employee={selectedEmployee}
        onEdit={(emp) => {
          setEditingEmployee(emp);
          setIsFormModalOpen(true);
        }}
      />

      {/* CONFIRMATION DIALOG FOR DELETION */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to delete the employee record for ${deleteTarget?.name}? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
};

export default EmployeeList;
