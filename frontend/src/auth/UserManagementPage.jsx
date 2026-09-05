import React from 'react';
import { Card, Table, Badge, Button } from '../components/ui';
import { UserPlus, Shield } from 'lucide-react';

export const UserManagementPage = () => {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-text">
          <h1 className="page-title">User Management & Permissions</h1>
          <p className="page-description">Configure system users, assign role-based permissions, and manage access rights.</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={UserPlus}>Add System User</Button>
        </div>
      </div>

      <Card title="Registered System Users" subtitle="Manage RBAC roles (Admin, HR Manager, Payroll Officer, Employee)">
        <Table headers={['User', 'Email', 'Role', 'Status', 'Last Login']}>
          <tr>
            <td><strong>Devang Patel</strong></td>
            <td>devang.patel@peoplepay360.io</td>
            <td><Badge variant="accent"><Shield size={12} /> System Admin</Badge></td>
            <td><Badge variant="success" dot>Active</Badge></td>
            <td>Today, 11:14 AM</td>
          </tr>
          <tr>
            <td><strong>Sarah Jenkins</strong></td>
            <td>sarah.j@peoplepay360.io</td>
            <td><Badge variant="primary">HR Manager</Badge></td>
            <td><Badge variant="success" dot>Active</Badge></td>
            <td>Yesterday</td>
          </tr>
          <tr>
            <td><strong>Robert Chen</strong></td>
            <td>robert.c@peoplepay360.io</td>
            <td><Badge variant="warning">Payroll Officer</Badge></td>
            <td><Badge variant="success" dot>Active</Badge></td>
            <td>3 days ago</td>
          </tr>
        </Table>
      </Card>
    </div>
  );
};
