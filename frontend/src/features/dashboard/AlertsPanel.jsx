import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { 
  AlertTriangle, 
  FileQuestion, 
  Clock, 
  Calendar, 
  AlertOctagon, 
  ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlertsPanel = ({ warnings = [] }) => {
  const navigate = useNavigate();

  const defaultWarnings = [
    {
      id: 'warn-01',
      type: 'missing-contract',
      title: '4 Employees Missing Active Contracts',
      description: 'Alexander Wright and 3 others have no running contract for the Sep 2026 pay period.',
      severity: 'critical',
      targetPath: '/contracts',
      actionLabel: 'Assign Contracts',
      icon: FileQuestion,
    },
    {
      id: 'warn-02',
      type: 'payroll-warning',
      title: 'Missing Bank Details for Direct Deposit',
      description: '2 new engineering hires do not have IBAN/routing numbers configured on their profile.',
      severity: 'critical',
      targetPath: '/payroll',
      actionLabel: 'Fix Bank Info',
      icon: AlertOctagon,
    },
    {
      id: 'warn-03',
      type: 'attendance-exception',
      title: '3 Unresolved Check-in Disputes',
      description: 'Overtime hours correction requested by Sophia Martinez requires supervisor sign-off.',
      severity: 'warning',
      targetPath: '/attendance',
      actionLabel: 'Review Disputes',
      icon: Clock,
    },
    {
      id: 'warn-04',
      type: 'pending-leave',
      title: '5 Pending Leave Approval Requests',
      description: 'Annual paid leave requests submitted for next week awaiting HR approval.',
      severity: 'warning',
      targetPath: '/time-off',
      actionLabel: 'Approve Leaves',
      icon: Calendar,
    },
  ];

  const itemsToRender = warnings.length > 0 ? warnings : defaultWarnings;

  return (
    <Card 
      title="Attention Required" 
      subtitle="Actionable anomalies & requests requiring HR/Payroll resolution"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {itemsToRender.map((item) => {
          const Icon = item.icon || AlertTriangle;
          const isCritical = item.severity === 'critical';

          return (
            <div 
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: isCritical ? '#FFF1F2' : '#FEF3C7',
                border: `1px solid ${isCritical ? '#FECDD3' : '#FDE68A'}`,
                transition: 'all 150ms ease',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '260px' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: isCritical ? '#FFE4E6' : '#FEF3C7',
                  color: isCritical ? '#E11D48' : '#D97706',
                  flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{item.title}</strong>
                    <Badge variant={isCritical ? 'error' : 'warning'}>
                      {isCritical ? 'Critical' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
                    {item.description}
                  </p>
                </div>
              </div>

              <Button
                variant={isCritical ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => navigate(item.targetPath)}
                style={{ flexShrink: 0 }}
              >
                <span>{item.actionLabel}</span>
                <ChevronRight size={14} />
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
