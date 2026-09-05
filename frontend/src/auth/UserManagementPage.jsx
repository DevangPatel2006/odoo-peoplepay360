import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert } from '../components/ui';
import { UserPlus, Shield, RefreshCw } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchUsers();
  }, []);

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

      <Card title="Registered System Users" subtitle="Live database users and RBAC roles (Admin, HR Manager, HR Payroll User, Employee)">
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
          <Table headers={['User', 'Email', 'Assigned Roles', 'Status', 'Last Login']}>
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
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
};

export default UserManagementPage;
