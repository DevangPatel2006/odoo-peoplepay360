import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Modal, Select } from '../components/ui';
import { UserPlus, Shield, RefreshCw, Edit3 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useApp } from '../store';

export const UserManagementPage = () => {
  const { addToast } = useApp();
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state for editing a user's role
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/users');
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

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const openRoleModal = (u) => {
    setSelectedUser(u);
    const currentRoleId = u.roles?.[0]?.id || (availableRoles.find(r => r.name === 'Employee')?.id || '1');
    setSelectedRoleId(String(currentRoleId));
    setIsModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setSavingRole(true);
    try {
      await axiosClient.put(`/users/${selectedUser.id}/roles`, {
        role_ids: [parseInt(selectedRoleId, 10)],
      });
      addToast(`Updated role for ${selectedUser.work_email}`, 'success');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      addToast(err.response?.data?.error?.message || 'Failed to update user role', 'error');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-text">
          <h1 className="page-title">User Management & Permissions</h1>
          <p className="page-description">Configure system users, assign role-based permissions, and manage access rights.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <Card title="Registered System Users" subtitle="Live database users and RBAC roles (Admin, HR Manager, HR Payroll Manager, HR Payroll User, Employee)">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner size="md" />
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading registered users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            No registered users found.
          </div>
        ) : (
          <Table headers={['User', 'Email', 'Assigned Roles', 'Status', 'Last Login', 'Actions']}>
            {users.map((u) => {
              const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'System User';
              const roles = Array.isArray(u.roles) ? u.roles : [];
              const lastLogin = u.last_login_at 
                ? new Date(u.last_login_at).toLocaleString() 
                : 'Never logged in';

              return (
                <tr key={u.id}>
                  <td>
                    <strong>{fullName}</strong>
                    {u.employee_code && (
                      <div className="text-xs text-muted">ID: {u.employee_code}</div>
                    )}
                  </td>
                  <td><span className="text-sm font-mono">{u.work_email}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {roles.length > 0 ? (
                        roles.map((r) => {
                          const roleName = r.name || r;
                          const isAdm = String(roleName).toLowerCase().includes('admin');
                          const isMgr = String(roleName).toLowerCase().includes('manager');
                          const isPay = String(roleName).toLowerCase().includes('payroll');

                          return (
                            <Badge 
                              key={r.id || roleName} 
                              variant={isAdm ? 'accent' : isMgr ? 'primary' : isPay ? 'warning' : 'neutral'}
                            >
                              {isAdm && <Shield size={12} style={{ marginRight: '4px' }} />}
                              {roleName}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted">No Roles Assigned</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.is_active ? 'success' : 'neutral'} dot>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td><span className="text-xs text-secondary">{lastLogin}</span></td>
                  <td>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      icon={Edit3}
                      onClick={() => openRoleModal(u)}
                    >
                      Change Role
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Role Management Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Assign Role — ${selectedUser?.work_email || ''}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateRole} loading={savingRole}>
              Save Role
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p className="text-sm text-secondary">
            Select the system role to assign to <strong>{selectedUser?.work_email}</strong>. This changes their platform permissions and accessible modules.
          </p>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              System RBAC Role
            </label>
            <Select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{ width: '100%' }}
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.description}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
