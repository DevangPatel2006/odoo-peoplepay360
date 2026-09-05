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

  return (
    <Card 
      title="Attendance Snapshot" 
      subtitle="Aggregated check-in & worked hours from active records"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
          <span>View All</span>
          <ArrowRight size={14} />
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Present Today
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#0F172A' }}>
            {presentTotal}
          </div>
        </div>

        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>
            <Clock size={14} /> On Leave
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#0F172A' }}>
            {onLeaveTotal}
          </div>
        </div>

        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E11D48', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={14} /> Exceptions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#0F172A' }}>
            {unresolvedTotal}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-xs text-secondary">
          Recorded total worked hours: <strong>{totalWorkedHours.toFixed(1)} hrs</strong> ({avgWorkedHours} hrs avg/record)
        </span>
        <Badge variant={unresolvedTotal === 0 ? 'success' : 'warning'}>
          {unresolvedTotal === 0 ? 'Normal' : 'Requires Review'}
        </Badge>
      </div>
    </Card>
  );
};

export default AttendanceOverview;
