import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert } from '../../components/ui';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const TimeOffTypeForm = ({ isOpen, onClose, onSave, initialData }) => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    unit: 'Days',
    requires_allocation: true,
    approval_level: 'Manager',
    affects_payroll: true,
    display_color: '#2563EB',
    is_active: true,
    configuration_notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        unit: initialData.unit || 'Days',
        requires_allocation: initialData.requires_allocation ?? true,
        approval_level: initialData.approval_level || 'Manager',
        affects_payroll: initialData.affects_payroll ?? true,
        display_color: initialData.display_color || '#2563EB',
        is_active: initialData.is_active ?? true,
        configuration_notes: initialData.configuration_notes || '',
      });
    } else {
      setFormData({
        name: '',
        unit: 'Days',
        requires_allocation: true,
        approval_level: 'Manager',
        affects_payroll: true,
        display_color: '#2563EB',
        is_active: true,
        configuration_notes: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let saved;
      if (initialData?.id) {
        const res = await axiosClient.put(`/time-off/types/${initialData.id}`, formData);
        saved = res.data;
        addToast('Time off type updated successfully', 'success');
      } else {
        const res = await axiosClient.post('/time-off/types', formData);
        saved = res.data;
        addToast('Time off type created successfully', 'success');
      }
      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save time off type:', err);
      setError(err.response?.data?.error?.message || 'Failed to save time off type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Time Off Type' : 'Create Time Off Type'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Leave Type Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Paid Vacation, Sick Leave"
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="input-label">Measurement Unit</label>
            <Select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="Days">Days</option>
              <option value="Hours">Hours</option>
            </Select>
          </div>

          <div>
            <label className="input-label">Approval Authority</label>
            <Select
              value={formData.approval_level}
              onChange={(e) => setFormData({ ...formData, approval_level: e.target.value })}
            >
              <option value="None">None (Auto-approved)</option>
              <option value="Manager">Direct Manager</option>
              <option value="HR">HR Admin</option>
            </Select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="input-label">Display Badge Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={formData.display_color}
                onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                style={{ width: '40px', height: '36px', padding: '0', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer' }}
              />
              <span className="font-mono text-xs">{formData.display_color}</span>
            </div>
          </div>

          <div>
            <label className="input-label">Status</label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Archived / Inactive</option>
            </Select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.requires_allocation}
              onChange={(e) => setFormData({ ...formData, requires_allocation: e.target.checked })}
            />
            <span>Requires allocated balance quota to request</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.affects_payroll}
              onChange={(e) => setFormData({ ...formData, affects_payroll: e.target.checked })}
            />
            <span>Impacts Payroll calculations (Paid Leave)</span>
          </label>
        </div>

        <Input
          label="Configuration / Policy Notes"
          value={formData.configuration_notes}
          onChange={(e) => setFormData({ ...formData, configuration_notes: e.target.value })}
          placeholder="Optional notes or eligibility requirements..."
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {initialData ? 'Update Type' : 'Create Type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TimeOffTypeForm;
