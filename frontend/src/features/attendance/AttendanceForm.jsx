import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../components/ui';
import { Save, Clock, AlertTriangle } from 'lucide-react';

export const AttendanceForm = ({ attendance, onSave, onCancel, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    employeeName: attendance?.employeeName || 'Alexander Wright',
    date: attendance?.date || new Date().toISOString().split('T')[0],
    checkIn: attendance?.checkIn || '09:00',
    checkOut: attendance?.checkOut || '17:00',
    status: attendance?.status || 'Present',
    reason: attendance?.reason || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Check RBAC permission for editing
  const canEdit = userRole === 'admin' || userRole === 'HR Manager' || userRole === 'hr';

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.checkIn) newErrors.checkIn = 'Check-in time is required';
    if (!formData.checkOut && formData.status !== 'Missing Check-Out') {
      newErrors.checkOut = 'Check-out time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!validate()) return;

    setLoading(true);
    setSuccessMsg('');

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Attendance record updated.');
      setTimeout(() => {
        onSave({
          ...formData,
          id: attendance?.id || `ATT-${Math.floor(100 + Math.random() * 900)}`,
          workedHours: '8.0 hrs', // Consumed from backend contract
        });
      }, 400);
    }, 400);
  };

  if (!canEdit) {
    return (
      <Alert type="warning" title="Permission Restricted">
        Editing attendance records requires HR Manager or Administrator authorization.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <Input
        label="Employee Name"
        value={formData.employeeName}
        disabled
      />

      <Input
        label="Attendance Date *"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Check-In Time *"
          type="time"
          value={formData.checkIn}
          onChange={(e) => handleChange('checkIn', e.target.value)}
          error={errors.checkIn}
        />
        <Input
          label="Check-Out Time *"
          type="time"
          value={formData.checkOut}
          onChange={(e) => handleChange('checkOut', e.target.value)}
          error={errors.checkOut}
        />
      </div>

      <Select
        label="Attendance Status"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={[
          { value: 'Present', label: 'Present (Normal)' },
          { value: 'Disputed', label: 'Disputed (Overtime / Shift dispute)' },
          { value: 'Missing Check-Out', label: 'Missing Check-Out (Anomalous)' },
          { value: 'On Leave', label: 'On Leave' },
        ]}
      />

      <Input
        label="Correction Notes / Reason"
        value={formData.reason}
        onChange={(e) => handleChange('reason', e.target.value)}
        placeholder="Reason for attendance correction..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Correction Record
        </Button>
      </div>
    </form>
  );
};
