import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Spinner, Alert, ConfirmModal } from '../../components/ui';
import { ScheduleForm } from './ScheduleForm';
import { Plus, Clock, Calendar, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const ScheduleList = () => {
  const { addToast } = useApp();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const mapSchedule = (sch) => {
    const lines = sch.lines || [];
    const firstLine = lines[0] || {};
    return {
      ...sch,
      id: sch.id,
      name: sch.name,
      workingDays: sch.workingDays || (lines.length > 0 ? `${lines[0]?.day_of_week} - ${lines[lines.length - 1]?.day_of_week}` : 'Monday - Friday'),
      startTime: sch.startTime || (firstLine.start_time ? String(firstLine.start_time).slice(0, 5) : '09:00'),
      endTime: sch.endTime || (firstLine.end_time ? String(firstLine.end_time).slice(0, 5) : '17:00'),
      breakMinutes: sch.breakMinutes || (firstLine.break_minutes ?? 60),
      expectedHours: sch.expectedHours || sch.hours_per_week || '40.0',
      isDefault: sch.isDefault || sch.calendar_type === 'Standard',
      activeAssignedEmployees: sch.activeAssignedEmployees || 0,
    };
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/working-schedules');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setSchedules(list.map(mapSchedule));
    } catch (err) {
      console.error('Failed to load working schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSaveSchedule = (savedData) => {
    fetchSchedules();
    setIsFormModalOpen(false);
    setEditingSchedule(null);
    addToast(
      editingSchedule
        ? `Updated schedule pattern ${savedData?.name || ''}`
        : `Created new schedule pattern ${savedData?.name || ''}`,
      'success'
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/working-schedules/${deleteTarget.id}`);
      addToast(`Deleted schedule pattern ${deleteTarget.name}`, 'info');
      setDeleteTarget(null);
      fetchSchedules();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to delete schedule pattern.', 'error');
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
                      onClick={() => setDeleteTarget(sch)}
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

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Working Schedule"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Contracts and employee records tied to this pattern may be affected.`}
        confirmText="Delete Schedule"
        variant="danger"
      />
    </div>
  );
};

export default ScheduleList;
