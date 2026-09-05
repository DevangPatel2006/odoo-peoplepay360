import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

import { useApp } from '../../store';

export const AttendanceWidget = ({ onCheckIn, onCheckOut }) => {
  const { addToast } = useApp();
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:02 AM');
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isCheckedIn) {
        setIsCheckedIn(false);
        addToast('Successfully clocked out for today', 'info');
        if (onCheckOut) onCheckOut();
      } else {
        setIsCheckedIn(true);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckInTime(timeStr);
        addToast(`Successfully clocked in at ${timeStr}`, 'success');
        if (onCheckIn) onCheckIn();
      }
    }, 400);
  };

  return (
    <Card style={{ background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 100%)', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: isCheckedIn ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.25)',
            border: `1px solid ${isCheckedIn ? '#A7F3D0' : '#FDE68A'}`,
            color: isCheckedIn ? '#6EE7B7' : '#FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.125rem' }}>Daily Attendance Terminal</h3>
              <Badge variant={isCheckedIn ? 'success' : 'warning'}>
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </Badge>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '2px' }}>
              {isCheckedIn ? `Checked in today at ${checkInTime}` : 'You are currently checked out'}
            </p>
          </div>
        </div>

        <Button
          variant={isCheckedIn ? 'danger' : 'accent'}
          loading={loading}
          icon={isCheckedIn ? LogOut : LogIn}
          onClick={handleToggle}
        >
          {isCheckedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </div>
    </Card>
  );
};
