import React from 'react';
import { Card, Table, Badge } from '../../components/ui';

export const TimeOffTypeList = () => {
  const leaveTypes = [
    { id: 'TOT-01', name: 'Paid Vacation Leave', code: 'VAC', paid: true, requireApproval: true, defaultAllocation: '20 days / year' },
    { id: 'TOT-02', name: 'Sick Leave', code: 'SICK', paid: true, requireApproval: true, defaultAllocation: '10 days / year' },
    { id: 'TOT-03', name: 'Unpaid Personal Leave', code: 'UNPAID', paid: false, requireApproval: true, defaultAllocation: 'Unlimited' },
  ];

  return (
    <Table headers={['Leave Type Name', 'Code', 'Paid / Unpaid', 'Approval Policy', 'Standard Allocation']}>
      {leaveTypes.map((type) => (
        <tr key={type.id}>
          <td><strong style={{ color: '#0F172A' }}>{type.name}</strong></td>
          <td><span className="font-mono text-sm font-semibold">{type.code}</span></td>
          <td>
            <Badge variant={type.paid ? 'success' : 'neutral'}>
              {type.paid ? 'Paid Leave' : 'Unpaid Leave'}
            </Badge>
          </td>
          <td><span className="text-sm">{type.requireApproval ? 'Requires Manager Approval' : 'Auto Approval'}</span></td>
          <td><span className="text-sm font-medium">{type.defaultAllocation}</span></td>
        </tr>
      ))}
    </Table>
  );
};
