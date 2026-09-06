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

  const itemsToRender = (warnings || []).map((w) => ({
    id: w.id ? `warn-${w.id}` : Math.random(),
    type: w.warning_type || 'payroll-warning',
    title: w.warning_type === 'MissingBankDetails'
      ? `Missing Bank Account: ${w.first_name || ''} ${w.last_name || ''}`
      : (w.warning_type === 'DuplicatePayslip' ? 'Overlapping Payslip Alert' : (w.warning_type || 'Payroll Anomaly')),
    description: w.message || `Anomaly identified on payrun ${w.payrun_name || ''}`,
    severity: 'critical',
    targetPath: '/payroll',
    actionLabel: 'Resolve in Payroll',
    icon: AlertOctagon,
  }));

  return (
    <Card 
      title="Attention Required" 
      subtitle="Actionable anomalies & requests requiring HR/Payroll resolution"
    >
      {itemsToRender.length === 0 ? (
        <div style={{
          padding: '16px',
          backgroundColor: '#F0FDF4',
          borderRadius: '10px',
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#15803D',
          fontSize: '0.875rem'
        }}>
          <AlertTriangle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          <div>
            <strong>All systems clear:</strong> No blocking payroll warnings or unverified anomalies detected across active payruns.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {itemsToRender.map((item) => {
          const Icon = item.icon || AlertTriangle;
          const isCritical = item.severity === 'critical';

          return (
            <div 
              key={item.id}
              className="dashboard-interactive-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: isCritical ? '#FFF1F2' : '#FEF3C7',
                border: `1px solid ${isCritical ? '#FECDD3' : '#FDE68A'}`,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
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
      )}
    </Card>
  );
};
