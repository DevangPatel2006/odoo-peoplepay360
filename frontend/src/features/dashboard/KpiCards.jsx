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

  const totalEmps = data?.totalEmployees !== undefined ? data.totalEmployees : '—';
  const activeContracts = data?.activeContracts !== undefined ? data.activeContracts : '—';
  const payrunStatus = data?.payrunStatus || 'No Payruns';
  const pendingLeaves = data?.pendingLeaveRequests !== undefined ? data.pendingLeaveRequests : '—';
  const attendanceExceptions = data?.attendanceExceptions !== undefined ? data.attendanceExceptions : '—';
  const payrollWarnings = data?.payrollWarnings !== undefined ? data.payrollWarnings : '—';

  const kpis = [
    {
      id: 'total-employees',
      title: 'Total Employees',
      value: totalEmps,
      subtitle: 'Active organization workforce',
      icon: Users,
      colorType: 'normal',
      badge: { text: 'Workforce', type: 'primary' },
      onClick: () => navigate('/employees'),
    },
    {
      id: 'active-contracts',
      title: 'Active Contracts',
      value: activeContracts,
      subtitle: 'Verified running contracts',
      icon: FileCheck,
      colorType: 'success',
      badge: { text: 'Running', type: 'success' },
      onClick: () => navigate('/contracts'),
    },
    {
      id: 'payroll-status',
      title: 'Payroll / Payrun',
      value: payrunStatus,
      subtitle: data?.kpis?.total_net_salary_paid ? `Disbursed: $${parseFloat(data.kpis.total_net_salary_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Current Payrun Status',
      icon: DollarSign,
      colorType: 'normal',
      badge: { text: 'Payroll', type: 'accent' },
      onClick: () => navigate('/payroll'),
    },
    {
      id: 'pending-timeoff',
      title: 'Pending Time Off',
      value: pendingLeaves,
      subtitle: 'Leave requests awaiting signoff',
      icon: Calendar,
      colorType: 'warning',
      badge: { text: 'Review', type: 'warning' },
      onClick: () => navigate('/time-off'),
    },
    {
      id: 'attendance-exceptions',
      title: 'Attendance Exceptions',
      value: attendanceExceptions,
      subtitle: 'Disputed or missing checkouts',
      icon: AlertTriangle,
      colorType: attendanceExceptions > 0 ? 'warning' : 'normal',
      badge: { text: 'Attendance', type: attendanceExceptions > 0 ? 'warning' : 'neutral' },
      onClick: () => navigate('/attendance'),
    },
    {
      id: 'payroll-warnings',
      title: 'Payroll Warnings',
      value: payrollWarnings,
      subtitle: 'Unresolved payroll anomalies',
      icon: AlertOctagon,
      colorType: payrollWarnings > 0 ? 'critical' : 'normal',
      badge: { text: payrollWarnings > 0 ? 'Action Needed' : 'Clean', type: payrollWarnings > 0 ? 'error' : 'success' },
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
