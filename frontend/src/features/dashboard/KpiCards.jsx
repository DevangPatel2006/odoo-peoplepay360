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
      colorType: 'emerald',
      badge: { text: 'Workforce', type: 'accent' },
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
      badge: { text: 'Payroll', type: 'neutral' },
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
      colorType: payrollWarnings > 0 ? 'critical' : 'success',
      badge: { text: payrollWarnings > 0 ? 'Action Needed' : 'Clean', type: payrollWarnings > 0 ? 'error' : 'success' },
      onClick: () => navigate('/payroll'),
    },
  ];

  // Color logic mapping for Emerald & Slate palette
  const colorStyles = {
    emerald: {
      bg: '#ECFDF5',
      iconColor: '#059669',
      borderColor: '#A7F3D0',
    },
    normal: {
      bg: '#F1F5F9',
      iconColor: '#334155',
      borderColor: '#CBD5E1',
    },
    success: {
      bg: '#ECFDF5',
      iconColor: '#16A34A',
      borderColor: '#BBF7D0',
    },
    warning: {
      bg: '#FEF3C7',
      iconColor: '#D97706',
      borderColor: '#FDE68A',
    },
    critical: {
      bg: '#FEE2E2',
      iconColor: '#DC2626',
      borderColor: '#FECDD3',
    },
  };

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map((kpi) => {
        const style = colorStyles[kpi.colorType] || colorStyles.normal;
        const Icon = kpi.icon;

        return (
          <Card 
            key={kpi.id} 
            interactive 
            onClick={kpi.onClick}
            style={{ 
              borderTop: `3px solid ${style.iconColor}`,
              minHeight: '148px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span 
                  className="text-sm text-secondary font-medium"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={kpi.title}
                >
                  {kpi.title}
                </span>
                <div 
                  className="kpi-icon-wrapper"
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: style.bg,
                    color: style.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <Icon size={19} />
                </div>
              </div>

              <div 
                style={{
                  fontSize: typeof kpi.value === 'number' ? '1.75rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#12151A',
                  marginTop: '10px',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={String(kpi.value)}
              >
                {kpi.value}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginTop: '14px', 
              paddingTop: '10px', 
              borderTop: '1px solid #F1F5F9',
              gap: '8px'
            }}>
              <span 
                className="text-xs text-muted"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                title={kpi.subtitle}
              >
                {kpi.subtitle}
              </span>
              <Badge variant={kpi.badge.type} style={{ flexShrink: 0 }}>{kpi.badge.text}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
