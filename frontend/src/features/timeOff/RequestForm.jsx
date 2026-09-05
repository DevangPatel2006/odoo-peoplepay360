import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../components/ui';
import { Save, Calendar, FileText } from 'lucide-react';

export const RequestForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    employeeName: 'Alexander Wright',
    leaveType: 'Paid Vacation Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    durationDays: '3',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a brief reason';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit({
        ...formData,
        id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
        status: 'Pending',
        duration: `${formData.durationDays} days`,
      });
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Select
        label="Leave Type *"
        value={formData.leaveType}
        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
        options={[
          { value: 'Paid Vacation Leave', label: 'Paid Vacation Leave (Balance: 14 days)' },
          { value: 'Sick Leave', label: 'Sick Leave (Balance: 5 days)' },
          { value: 'Unpaid Leave', label: 'Unpaid Leave (Unlimited)' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Start Date *"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          error={errors.startDate}
        />
        <Input
          label="End Date *"
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          error={errors.endDate}
        />
      </div>

      <Input
        label="Duration (Days)"
        type="number"
        value={formData.durationDays}
        onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
      />

      <Input
        label="Reason / Description *"
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        error={errors.reason}
        placeholder="Reason for leave request..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Submit Leave Request
        </Button>
      </div>
    </form>
  );
};
