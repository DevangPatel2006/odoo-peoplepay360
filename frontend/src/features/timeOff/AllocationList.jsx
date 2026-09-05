import React, { useState } from 'react';
import { Card, Table, Badge, Button, Modal } from '../../components/ui';
import { Calendar, Plus } from 'lucide-react';

export const AllocationList = () => {
  const [allocations, setAllocations] = useState([
    { id: 'ALL-01', employeeName: 'Alexander Wright', type: 'Paid Vacation Leave', allocated: 20, used: 6, remaining: 14 },
    { id: 'ALL-02', employeeName: 'Sophia Martinez', type: 'Paid Vacation Leave', allocated: 20, used: 3, remaining: 17 },
    { id: 'ALL-03', employeeName: 'Marcus Vance', type: 'Paid Vacation Leave', allocated: 20, used: 6, remaining: 14 },
    { id: 'ALL-04', employeeName: 'Elena Rostova', type: 'Sick Leave', allocated: 10, used: 5, remaining: 5 },
    { id: 'ALL-05', employeeName: 'David Chen', type: 'Paid Vacation Leave', allocated: 15, used: 2, remaining: 13 },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Table headers={['Employee', 'Leave Type', 'Allocated Days', 'Used Days', 'Remaining Balance', 'Status']}>
        {allocations.map((alloc) => (
          <tr key={alloc.id}>
            <td><strong style={{ color: '#0F172A' }}>{alloc.employeeName}</strong></td>
            <td><span className="text-sm font-medium">{alloc.type}</span></td>
            <td><span className="font-semibold text-sm">{alloc.allocated} days</span></td>
            <td><span className="text-sm text-secondary">{alloc.used} days</span></td>
            <td>
              <strong className="text-success" style={{ fontSize: '0.95rem' }}>{alloc.remaining} days remaining</strong>
            </td>
            <td>
              <Badge variant={alloc.remaining > 5 ? 'success' : 'warning'}>
                {alloc.remaining > 5 ? 'Healthy Balance' : 'Low Balance'}
              </Badge>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
};
