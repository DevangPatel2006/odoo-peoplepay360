import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AttendanceOverview = ({ data = [] }) => {
  const navigate = useNavigate();

  const rows = Array.isArray(data) ? data : [];
  const presentTotal = rows.reduce((acc, r) => acc + parseInt(r.present_count || 0, 10), 0);
  const onLeaveTotal = rows.reduce((acc, r) => acc + parseInt(r.on_leave_count || 0, 10), 0);
  const unresolvedTotal = rows.reduce((acc, r) => acc + parseInt(r.late_count || 0, 10) + parseInt(r.absent_count || 0, 10) + parseInt(r.manual_corrections_count || 0, 10), 0);
  const totalWorkedHours = rows.reduce((acc, r) => acc + parseFloat(r.total_worked_hours || 0), 0);
  const totalRecords = rows.reduce((acc, r) => acc + parseInt(r.total_attendance_records || 0, 10), 0);
  const avgWorkedHours = totalRecords > 0 ? (totalWorkedHours / totalRecords).toFixed(1) : '0.0';

  const totalOvertime = rows.reduce((acc, r) => acc + parseFloat(r.total_overtime_hours || 0), 0);
  const lateCount = rows.reduce((acc, r) => acc + parseInt(r.late_count || 0, 10), 0);
  const manualCorrections = rows.reduce((acc, r) => acc + parseInt(r.manual_corrections_count || 0, 10), 0);
  const avgCoverage = totalRecords > 0 ? Math.round((presentTotal / totalRecords) * 100) : 100;

  return (
    <Card 
      className="dashboard-card"
      title="Attendance Snapshot" 
      subtitle="Aggregated check-in & worked hours from active records"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
          <span>View All</span>
          <ArrowRight size={14} />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '12px' }}>
        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div className="dashboard-interactive-row" style={{ padding: '12px 10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Present
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#12151A', fontVariantNumeric: 'tabular-nums' }}>
              {presentTotal}
            </div>
          </div>

          <div className="dashboard-interactive-row" style={{ padding: '12px 10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>
              <Clock size={13} /> On Leave
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#12151A', fontVariantNumeric: 'tabular-nums' }}>
              {onLeaveTotal}
            </div>
          </div>

          <div className="dashboard-interactive-row" style={{ padding: '12px 10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#DC2626', fontSize: '0.75rem', fontWeight: 600 }}>
              <AlertTriangle size={13} /> Exceptions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#12151A', fontVariantNumeric: 'tabular-nums' }}>
              {unresolvedTotal}
            </div>
          </div>
        </div>

        {/* Presence & Hours Distribution */}
        <div className="dashboard-interactive-row" style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.8125rem' }}>
            <span className="text-secondary font-medium">Workforce Presence Rate</span>
            <strong style={{ color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{avgCoverage}% Present</strong>
          </div>
          <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, avgCoverage))}%`, backgroundColor: '#059669', borderRadius: '3px', transition: 'width 300ms ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
            <span>Overtime: <strong style={{ color: '#0F172A' }}>{totalOvertime.toFixed(1)}h</strong></span>
            <span>Late Arrivals: <strong style={{ color: '#0F172A' }}>{lateCount}</strong></span>
            <span>Manual Edits: <strong style={{ color: '#0F172A' }}>{manualCorrections}</strong></span>
          </div>
        </div>

        {/* Bottom Status Banner */}
        <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span className="text-xs text-secondary">
            Recorded: <strong style={{ color: '#0F172A' }}>{totalWorkedHours.toFixed(1)} hrs</strong> ({avgWorkedHours}h avg)
          </span>
          <Badge variant={unresolvedTotal === 0 ? 'success' : 'warning'}>
            {unresolvedTotal === 0 ? 'Normal' : 'Requires Review'}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceOverview;
