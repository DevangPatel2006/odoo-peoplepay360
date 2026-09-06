import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Modal } from '../components/ui';
import { Shield, RefreshCw, Edit3, Search, ChevronLeft, ChevronRight, Briefcase, Building, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useApp } from '../store';

export const UserManagementPage = () => {
  const { addToast } = useApp();
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modal state for editing a user's role and job position
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/users?pageSize=200');
      const list = Array.isArray(response.data) ? response.data : [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error?.message || 'Failed to load system users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axiosClient.get('/users/roles');
      const list = Array.isArray(res.data) ? res.data : [];
      setAvailableRoles(list);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const fetchJobPositions = async () => {
    try {
      const res = await axiosClient.get('/job-positions');
      const list = Array.isArray(res.data) ? res.data : [];
      setJobPositions(list);
    } catch (err) {
      console.error('Failed to load job positions:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchJobPositions();
  }, []);

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.work_email || '').toLowerCase();
      const empCode = (u.employee_code || '').toLowerCase();
      const dept = (u.department_name || '').toLowerCase();
      const pos = (u.job_position_title || '').toLowerCase();

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || empCode.includes(q) || dept.includes(q) || pos.includes(q);
      const matchesDept = selectedDeptFilter === 'ALL' || u.department_name === selectedDeptFilter;
      
      const userRoles = Array.isArray(u.roles) ? u.roles.map(r => r.name || r) : [];
      const matchesRole = selectedRoleFilter === 'ALL' || userRoles.includes(selectedRoleFilter);

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [users, searchQuery, selectedDeptFilter, selectedRoleFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter, selectedRoleFilter]);

  // Paginated records
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      if (u.department_name) set.add(u.department_name);
    });
    return Array.from(set).sort();
  }, [users]);

  // Grouped job positions by department for modal selector
  const groupedPositions = useMemo(() => {
    const groups = {};
    jobPositions.forEach((jp) => {
      const dept = jp.department_name || 'General';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(jp);
    });
    return groups;
  }, [jobPositions]);

  const openEditModal = (u) => {
    setSelectedUser(u);
    const currentRoleId = u.roles?.[0]?.id || (availableRoles.find(r => r.name === 'Employee')?.id || '1');
    setSelectedRoleId(String(currentRoleId));
    setSelectedPositionId(String(u.job_position_id || ''));
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {};
      if (selectedRoleId) {
        payload.role_ids = [parseInt(selectedRoleId, 10)];
      }
      if (selectedPositionId) {
        payload.job_position_id = parseInt(selectedPositionId, 10);
      }

      await axiosClient.put(`/users/${selectedUser.id}`, payload);
      
      const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.work_email;
      addToast(`Updated role and position for ${userName}`, 'success');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
      addToast(err.response?.data?.error?.message || 'Failed to update user position and role', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Role pill styling helper
  const getRoleBadgeVariant = (roleName) => {
    const r = String(roleName).toLowerCase();
    if (r.includes('admin')) return 'accent';
    if (r.includes('payroll manager')) return 'warning';
    if (r.includes('payroll')) return 'info';
    if (r.includes('manager')) return 'primary';
    return 'neutral';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header-text">
          <h1 className="page-title" style={{ fontSize: '1.65rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ color: 'var(--color-primary)' }} size={26} />
            User Management & Role Permissions
          </h1>
          <p className="page-description" style={{ color: '#64748B', marginTop: '4px' }}>
            Administrator console to manage all registered enterprise users, assign RBAC permissions, and update employee job positions.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            <span>Total Accounts:</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{users.length}</span>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error" style={{ marginBottom: '20px' }}>{error}</Alert>}

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        backgroundColor: '#FFFFFF', 
        padding: '16px 20px', 
        borderRadius: '12px', 
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px', minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', width: '100%', height: '38px', borderRadius: '8px' }}
            placeholder="Search by name, email, ID, or job position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="input"
            style={{ width: '100%', height: '38px', borderRadius: '8px' }}
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments ({users.length})</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="input"
            style={{ width: '100%', height: '38px', borderRadius: '8px' }}
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || selectedDeptFilter !== 'ALL' || selectedRoleFilter !== 'ALL') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSearchQuery(''); setSelectedDeptFilter('ALL'); setSelectedRoleFilter('ALL'); }}
            style={{ color: '#64748B' }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Main Users Table Card */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Registered Users & Permissions ({filteredUsers.length} shown)</span>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 400 }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        }
        subtitle="Full directory of enterprise accounts. Admin has exclusive rights to modify roles and assign employee job positions."
      >
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Spinner size="lg" />
            <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>Loading system user database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>No users match your criteria</p>
            <p className="text-sm text-muted" style={{ marginTop: '4px' }}>Try clearing the search or department filters.</p>
          </div>
        ) : (
          <>
            <Table headers={['User & ID', 'Work Email', 'Department', 'Job Position', 'RBAC Role', 'Status', 'Actions']}>
              {paginatedUsers.map((u) => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'System User';
                const roles = Array.isArray(u.roles) ? u.roles : [];
                const initials = (u.first_name?.[0] || '') + (u.last_name?.[0] || 'U');

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <strong style={{ color: '#0F172A', display: 'block' }}>{fullName}</strong>
                          <span className="text-xs text-muted font-mono">{u.employee_code || `EMP-${u.id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-mono" style={{ color: '#334155' }}>{u.work_email}</span>
                    </td>
                    <td>
                      <Badge variant="neutral">
                        <Building size={11} style={{ marginRight: '4px' }} />
                        {u.department_name || 'General Management'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Briefcase size={13} style={{ color: '#64748B' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>
                          {u.job_position_title || 'Staff Specialist'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {roles.length > 0 ? (
                          roles.map((r) => {
                            const roleName = r.name || r;
                            const isAdm = String(roleName).toLowerCase().includes('admin');

                            return (
                              <Badge 
                                key={r.id || roleName} 
                                variant={getRoleBadgeVariant(roleName)}
                              >
                                {isAdm && <Shield size={11} style={{ marginRight: '4px' }} />}
                                {roleName}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted">No Role</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.is_active ? 'success' : 'neutral'} dot>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline" 
                        size="xs" 
                        icon={Edit3}
                        onClick={() => openEditModal(u)}
                        style={{ borderColor: '#CBD5E1', color: '#1E293B' }}
                      >
                        Edit Position & Role
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '16px', 
                padding: '12px 16px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '8px', 
                border: '1px solid #E2E8F0',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span className="text-sm text-secondary">
                  Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    icon={ChevronLeft} 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px', color: '#334155' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    icon={ChevronRight} 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Edit Role & Job Position Modal (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Employee Position & System Role"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChanges} loading={saving} icon={CheckCircle2}>
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* User Details Preview Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </div>
                <div className="text-xs text-muted font-mono" style={{ marginTop: '2px' }}>
                  {selectedUser.work_email} • {selectedUser.employee_code || `EMP-${selectedUser.id}`}
                </div>
              </div>
              <Badge variant="neutral">
                {selectedUser.department_name || 'General Management'}
              </Badge>
            </div>

            {/* Job Position Dropdown */}
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0F172A' }}>
                Assigned Job Position (Designation)
              </label>
              <select
                className="input"
                style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '0.9rem' }}
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
              >
                <option value="">-- Select Job Position --</option>
                {Object.entries(groupedPositions).map(([dept, positions]) => (
                  <optgroup key={dept} label={dept}>
                    {positions.map((jp) => (
                      <option key={jp.id} value={jp.id}>
                        {jp.title} ({dept})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-muted" style={{ marginTop: '5px' }}>
                Changing the position modifies this employee's primary job title in HR records and salary structures.
              </p>
            </div>

            {/* System RBAC Role Dropdown */}
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0F172A' }}>
                System RBAC Access Role
              </label>
              <select
                className="input"
                style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '0.9rem' }}
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted" style={{ marginTop: '5px' }}>
                Controls module access, permissions (Read/Write/Delete/Approve), and UI tabs available to this user.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;
