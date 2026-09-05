import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Clock, CheckCircle2, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AttendanceOverview = () => {
  const navigate = useNavigate();

  return (
    <Card 
      title="Today's Attendance Snapshot" 
      subtitle="Real-time employee check-in & worked hours overview"
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
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>128</div>
        </div>

        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>
            <Clock size={14} /> On Leave
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>9</div>
        </div>

        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E11D48', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={14} /> Unresolved
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>5</div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-xs text-secondary">Average worked hours this week: <strong>39.4 hrs</strong></span>
        <Badge variant="primary">On Schedule</Badge>
      </div>
    </Card>
  );
};
