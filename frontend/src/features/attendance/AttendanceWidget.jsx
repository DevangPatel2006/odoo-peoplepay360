import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Clock, LogIn, LogOut } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';

export const AttendanceWidget = ({ onRefresh }) => {
  const { addToast } = useApp();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // On mount, check today's attendance status from the real API
  useEffect(() => {
    let isMounted = true;
    const checkTodayStatus = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await axiosClient.get(`/attendance?start_date=${today}&end_date=${today}`);
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        if (isMounted && list.length > 0) {
          const todayRecord = list[0];
          if (todayRecord.check_in_at && !todayRecord.check_out_at) {
            // Checked in but not out
            setIsCheckedIn(true);
            setCheckInTime(new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } else if (todayRecord.check_in_at && todayRecord.check_out_at) {
            // Already fully checked in and out
            setIsCheckedIn(false);
            setCheckInTime(new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        // Non-critical — widget will default to "not checked in"
        console.warn('Could not load today\'s attendance status:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    checkTodayStatus();
    return () => { isMounted = false; };
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post('/attendance/check-in', {});
      const record = res.data?.data || res.data;
      const time = record?.check_in_at
        ? new Date(record.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(true);
      setCheckInTime(time);
      addToast(`Successfully clocked in at ${time}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to check in';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await axiosClient.post('/attendance/check-out', {});
      setIsCheckedIn(false);
      addToast('Successfully clocked out for today', 'info');
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to check out';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
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
              {!initialLoading && (
                <Badge variant={isCheckedIn ? 'success' : 'warning'}>
                  {isCheckedIn ? 'Checked In' : 'Checked Out'}
                </Badge>
              )}
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '2px' }}>
              {initialLoading
                ? 'Loading today\'s status...'
                : isCheckedIn
                  ? `Checked in today at ${checkInTime}`
                  : 'You are currently checked out'}
            </p>
          </div>
        </div>

        <Button
          variant={isCheckedIn ? 'danger' : 'accent'}
          loading={loading || initialLoading}
          icon={isCheckedIn ? LogOut : LogIn}
          onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
        >
          {isCheckedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </div>
    </Card>
  );
};
