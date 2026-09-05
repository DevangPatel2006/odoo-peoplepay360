import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../components/ui';
import { Save, Clock, Calendar, Sun } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const ScheduleForm = ({ schedule, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    workingDays: schedule?.workingDays || 'Monday - Friday',
    startTime: schedule?.startTime || '09:00',
    endTime: schedule?.endTime || '17:00',
    breakMinutes: schedule?.breakMinutes || '60',
    expectedHours: schedule?.expectedHours || '40.0',
    isDefault: schedule?.isDefault || false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Schedule name is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.expectedHours || Number(formData.expectedHours) <= 0) {
      newErrors.expectedHours = 'Valid weekly expected hours required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const days = formData.workingDays === 'Monday - Saturday'
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const lines = days.map((day) => ({
        day_of_week: day,
        start_time: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        end_time: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        break_minutes: parseInt(formData.breakMinutes, 10) || 0,
      }));

      const payload = {
        name: formData.name.trim(),
        calendar_type: 'Standard',
        timezone: 'UTC',
        status: 'Active',
        lines,
      };

      let res;
      if (schedule?.id && typeof schedule.id === 'number') {
        res = await axiosClient.patch(`/working-schedules/${schedule.id}`, payload);
      } else {
        res = await axiosClient.post('/working-schedules', payload);
      }
      onSave(res.data);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save working schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {apiError && <Alert type="error">{apiError}</Alert>}

      <Input
        label="Schedule Name *"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="e.g. Standard 40h/week (Mon-Fri 9-5)"
      />

      <Select
        label="Working Days *"
        value={formData.workingDays}
        onChange={(e) => handleChange('workingDays', e.target.value)}
        options={[
          { value: 'Monday - Friday', label: 'Monday - Friday (5 Days)' },
          { value: 'Monday - Saturday', label: 'Monday - Saturday (6 Days)' },
          { value: 'Rotational 4-on-4-off', label: 'Rotational 4-on 4-off' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Start Time *"
          type="time"
          value={formData.startTime}
          onChange={(e) => handleChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label="End Time *"
          type="time"
          value={formData.endTime}
          onChange={(e) => handleChange('endTime', e.target.value)}
          error={errors.endTime}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Daily Break (Minutes)"
          type="number"
          value={formData.breakMinutes}
          onChange={(e) => handleChange('breakMinutes', e.target.value)}
          placeholder="60"
        />
        <Input
          label="Expected Weekly Hours *"
          type="number"
          step="0.5"
          value={formData.expectedHours}
          onChange={(e) => handleChange('expectedHours', e.target.value)}
          error={errors.expectedHours}
          placeholder="40.0"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Schedule Pattern
        </Button>
      </div>
    </form>
  );
};
