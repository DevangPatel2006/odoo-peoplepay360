import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Spinner, Alert } from '../../components/ui';
import { ScheduleForm } from './ScheduleForm';
import { Plus, Clock, Calendar, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState('');

  const initialSchedules = [
    {
      id: 'SCH-001',
      name: 'Standard 40h/week (Mon-Fri 9-5)',
      workingDays: 'Monday - Friday',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: '60',
      expectedHours: '40.0',
      isDefault: true,
      activeAssignedEmployees: 112,
    },
    {
      id: 'SCH-002',
      name: 'Flexible 35h/week',
      workingDays: 'Monday - Friday',
      startTime: '09:00',
      endTime: '16:30',
      breakMinutes: '30',
      expectedHours: '35.0',
      isDefault: false,
      activeAssignedEmployees: 18,
    },
    {
      id: 'SCH-003',
      name: 'Rotational Shift Pattern A',
      workingDays: 'Monday - Saturday',
      startTime: '08:00',
      endTime: '16:00',
      breakMinutes: '60',
      expectedHours: '42.0',
      isDefault: false,
      activeAssignedEmployees: 12,
    },
  ];

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/working-schedules');
      if (response.data && Array.isArray(response.data)) {
        setSchedules(response.data);
      } else {
        setSchedules(initialSchedules);
      }
    } catch (err) {
      setSchedules(initialSchedules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSaveSchedule = (savedData) => {
    if (editingSchedule) {
      setSchedules((prev) => prev.map((s) => (s.id === savedData.id ? savedData : s)));
      setNotificationMsg(`Updated schedule pattern ${savedData.name}`);
    } else {
      setSchedules((prev) => [savedData, ...prev]);
      setNotificationMsg(`Created new schedule pattern ${savedData.name}`);
    }
    setIsFormModalOpen(false);
    setEditingSchedule(null);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleDeleteSchedule = (id, name) => {
    if (window.confirm(`Are you sure you want to delete schedule ${name}?`)) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      setNotificationMsg(`Deleted schedule ${name}`);
      setTimeout(() => setNotificationMsg(''), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Working Schedules & Shift Patterns</h1>
          <p className="page-description">
            Configure weekly work patterns, expected working hours, daily breaks, and shift timings.
          </p>
        </div>
        <div className="page-actions">
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => {
              setEditingSchedule(null);
              setIsFormModalOpen(true);
            }}
          >
            Create Working Schedule
          </Button>
        </div>
      </div>

      {notificationMsg && <Alert type="success">{notificationMsg}</Alert>}

      {/* SCHEDULE CARDS GRID */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {schedules.map((sch) => (
            <Card key={sch.id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>{sch.name}</h3>
                  <span className="text-xs text-muted">ID: {sch.id}</span>
                </div>
                {sch.isDefault && (
                  <Badge variant="accent">
                    <CheckCircle2 size={12} /> Default Pattern
                  </Badge>
                )}
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="text-muted">Working Days:</span>
                  <strong style={{ color: '#0F172A' }}>{sch.workingDays}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="text-muted">Shift Timing:</span>
                  <span>{sch.startTime} - {sch.endTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="text-muted">Daily Break:</span>
                  <span>{sch.breakMinutes} mins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Expected Weekly:</span>
                  <strong className="text-accent">{sch.expectedHours} hrs / week</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-xs text-secondary">
                  Assigned to <strong>{sch.activeAssignedEmployees || 0}</strong> employees
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Edit}
                    onClick={() => {
                      setEditingSchedule(sch);
                      setIsFormModalOpen(true);
                    }}
                  />
                  {!sch.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => handleDeleteSchedule(sch.id, sch.name)}
                      style={{ color: '#E11D48' }}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT SCHEDULE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingSchedule(null); }}
        title={editingSchedule ? `Edit Schedule: ${editingSchedule.name}` : 'Create Working Schedule'}
      >
        <ScheduleForm
          schedule={editingSchedule}
          onSave={handleSaveSchedule}
          onCancel={() => { setIsFormModalOpen(false); setEditingSchedule(null); }}
        />
      </Modal>
    </div>
  );
};

export default ScheduleList;
