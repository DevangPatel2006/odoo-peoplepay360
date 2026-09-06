import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TimeOffOverview = ({ data = [], recentRequests = [] }) => {
  const navigate = useNavigate();

  const hasRecent = Array.isArray(recentRequests) && recentRequests.length > 0;
  const typeRows = Array.isArray(data) ? data : [];

  return (
    <Card 
      className="dashboard-card"
      title="Time Off & Allocation Overview" 
      subtitle="Recent leave requests and allocation balances"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/time-off')}>
          <span>Manage Leaves</span>
          <ArrowRight size={14} />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {hasRecent ? (
          recentRequests.map((req) => {
            const empName = `${req.first_name || ''} ${req.last_name || ''}`.trim() || 'Employee';
            const startDate = req.start_date ? String(req.start_date).substring(0, 10) : '';
            const endDate = req.end_date ? String(req.end_date).substring(0, 10) : '';
            const dateStr = startDate ? ` (${startDate}${endDate && endDate !== startDate ? ` to ${endDate}` : ''})` : '';
            const isApproved = req.status === 'Approved';

            return (
              <div 
                key={req.id} 
                className="dashboard-interactive-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                  gap: '8px'
                }}
              >
                <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                  <div className="font-semibold" style={{ color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empName}</div>
                  <div className="text-xs text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.time_off_type_name || 'Leave'} • {req.duration} day{parseFloat(req.duration) !== 1 ? 's' : ''}{dateStr}
                  </div>
                </div>
                <Badge variant={isApproved ? 'success' : (req.status === 'Refused' ? 'danger' : 'warning')} style={{ flexShrink: 0 }}>
                  {req.status || 'Pending'}
                </Badge>
              </div>
            );
          })
        ) : typeRows.length > 0 ? (
          typeRows.slice(0, 4).map((t) => (
            <div 
              key={t.time_off_type_id || t.time_off_type_name} 
              className="dashboard-interactive-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '0.875rem',
                gap: '8px'
              }}
            >
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <div className="font-semibold" style={{ color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.time_off_type_name}</div>
                <div className="text-xs text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Allocated: {t.total_allocated} {t.unit || 'Days'} • Approved: {t.approved_amount}
                </div>
              </div>
              <Badge variant="neutral" style={{ flexShrink: 0 }}>
                {t.total_remaining} {t.unit || 'Days'} Left
              </Badge>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            <Calendar size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No recent leave requests or allocations found.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimeOffOverview;
