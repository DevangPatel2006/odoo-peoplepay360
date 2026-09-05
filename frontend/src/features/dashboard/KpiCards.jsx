import React from 'react';
import { Card, Badge } from '../../components/ui';
import { 
  Users, 
  FileCheck, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  AlertOctagon, 
  TrendingUp 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KpiCards = ({ data = {} }) => {
  const navigate = useNavigate();

  const kpis = [
    {
      id: 'total-employees',
      title: 'Total Employees',
      value: data.totalEmployees ?? 142,
      subtitle: '+4 added this month',
      icon: Users,
      colorType: 'normal',
      badge: { text: 'Active Workforce', type: 'primary' },
      onClick: () => navigate('/employees'),
    },
    {
      id: 'active-contracts',
      title: 'Active Contracts',
      value: data.activeContracts ?? 138,
      subtitle: '97.2% active coverage',
      icon: FileCheck,
      colorType: 'success',
      badge: { text: 'Running', type: 'success' },
      onClick: () => navigate('/contracts'),
    },
    {
      id: 'payroll-status',
      title: 'Payroll / Payrun',
      value: data.payrunStatus ?? 'Draft Scope',
      subtitle: 'Est. $485,200 for Sep 2026',
      icon: DollarSign,
      colorType: 'normal',
      badge: { text: 'Step 1 of 2', type: 'accent' },
      onClick: () => navigate('/payroll'),
    },
    {
      id: 'pending-timeoff',
      title: 'Pending Time Off',
      value: data.pendingLeaveRequests ?? 5,
      subtitle: 'Requires HR manager review',
      icon: Calendar,
      colorType: 'warning',
      badge: { text: 'Action Needed', type: 'warning' },
      onClick: () => navigate('/time-off'),
    },
    {
      id: 'attendance-exceptions',
      title: 'Attendance Exceptions',
      value: data.attendanceExceptions ?? 3,
      subtitle: 'Unresolved check-in disputes',
      icon: AlertTriangle,
      colorType: 'warning',
      badge: { text: 'Disputed', type: 'warning' },
      onClick: () => navigate('/attendance'),
    },
    {
      id: 'payroll-warnings',
      title: 'Payroll Warnings',
      value: data.payrollWarnings ?? 4,
      subtitle: 'Missing bank routing & details',
      icon: AlertOctagon,
      colorType: 'critical',
      badge: { text: 'Critical', type: 'error' },
      onClick: () => navigate('/payroll'),
    },
  ];

  // Color logic mapping
  const colorStyles = {
    normal: {
      bg: '#EFF6FF',
      iconColor: '#172554',
      borderColor: '#BFDBFE',
    },
    success: {
      bg: '#D1FAE5',
      iconColor: '#059669',
      borderColor: '#A7F3D0',
    },
    warning: {
      bg: '#FEF3C7',
      iconColor: '#D97706',
      borderColor: '#FDE68A',
    },
    critical: {
      bg: '#FFE4E6',
      iconColor: '#E11D48',
      borderColor: '#FECDD3',
    },
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {kpis.map((kpi) => {
        const style = colorStyles[kpi.colorType] || colorStyles.normal;
        const Icon = kpi.icon;

        return (
          <Card 
            key={kpi.id} 
            interactive 
            onClick={kpi.onClick}
            style={{ borderTop: `3px solid ${style.iconColor}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="text-sm text-secondary font-medium">{kpi.title}</span>
              <div style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: style.bg,
                color: style.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} />
              </div>
            </div>

            <div style={{
              fontSize: typeof kpi.value === 'number' ? '1.875rem' : '1.35rem',
              fontWeight: '700',
              color: '#0F172A',
              marginTop: '12px',
              lineHeight: 1.2
            }}>
              {kpi.value}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <span className="text-xs text-muted">{kpi.subtitle}</span>
              <Badge variant={kpi.badge.type}>{kpi.badge.text}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
