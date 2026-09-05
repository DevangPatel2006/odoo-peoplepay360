import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Calendar, ArrowRight, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TimeOffOverview = () => {
  const navigate = useNavigate();

  const recentRequests = [
    { id: 'req-01', employee: 'Marcus Vance', type: 'Paid Vacation', duration: '3 days (Sep 10 - Sep 12)', status: 'pending' },
    { id: 'req-02', employee: 'Elena Rostova', type: 'Sick Leave', duration: '1 day (Sep 05)', status: 'approved' },
    { id: 'req-03', employee: 'David Chen', type: 'Unpaid Leave', duration: '2 days (Sep 14 - Sep 15)', status: 'pending' },
  ];

  return (
    <Card 
      title="Time Off & Allocation Overview" 
      subtitle="Pending leave requests and allocation balances"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/time-off')}>
          <span>Manage Leaves</span>
          <ArrowRight size={14} />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recentRequests.map((req) => (
          <div key={req.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            fontSize: '0.875rem'
          }}>
            <div>
              <div className="font-semibold" style={{ color: '#0F172A' }}>{req.employee}</div>
              <div className="text-xs text-secondary">{req.type} • {req.duration}</div>
            </div>
            <Badge variant={req.status === 'approved' ? 'success' : 'warning'}>
              {req.status === 'approved' ? 'Approved' : 'Pending Approval'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
