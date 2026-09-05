import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Alert, Spinner } from '../../components/ui';
import { Save } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const RequestForm = ({ onSubmit, onCancel }) => {
  const { user, addToast } = useApp();
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    employee_id: '',
    time_off_type_id: '',
    start_date: todayStr,
    end_date: todayStr,
    duration: '1',
    reason: '',
  });

  const [errors, setErrors] = useState({});

  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || ''];
  const isElevated = userRoles.some((r) => {
    const role = String(r).toLowerCase().replace(/_/g, ' ').trim();
    return ['admin', 'administrator', 'hr manager', 'hr payroll user', 'hr payroll manager'].includes(role);
  });

  useEffect(() => {
    let isMounted = true;
    const loadDependencies = async () => {
      setLoadingMeta(true);
      try {
        const [empRes, typesRes] = await Promise.all([
          axiosClient.get('/employees').catch(() => ({ data: [] })),
          axiosClient.get('/time-off/types').catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;

        const empList = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
        const typeList = Array.isArray(typesRes.data) ? typesRes.data : (typesRes.data?.data || []);

        setEmployees(empList);
        setTypes(typeList);

        // Preselect employee (user's employee if exists, else first)
        const myEmpId = user?.employeeDbId || user?.employeeId;
        const defaultEmpId = myEmpId 
          ? String(myEmpId) 
          : (empList[0] ? String(empList[0].id) : '');

        const defaultTypeId = typeList[0] ? String(typeList[0].id) : '';

        setFormData((prev) => ({
          ...prev,
          employee_id: prev.employee_id || defaultEmpId,
          time_off_type_id: prev.time_off_type_id || defaultTypeId,
        }));
      } catch (err) {
        console.error('Failed to load leave request dependencies:', err);
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    loadDependencies();
    return () => { isMounted = false; };
  }, [user]);

  // Recalculate duration whenever start_date or end_date changes
  const handleDateChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    if (updated.start_date && updated.end_date) {
      const d1 = new Date(updated.start_date);
      const d2 = new Date(updated.end_date);
      if (d2 >= d1) {
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        updated.duration = String(diffDays);
      }
    }
    setFormData(updated);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.employee_id) newErrors.employee_id = 'Employee is required';
    if (!formData.time_off_type_id) newErrors.time_off_type_id = 'Time off type is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date cannot be earlier than start date';
    }
    if (!formData.duration || parseFloat(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please state the reason for this leave request';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        time_off_type_id: Number(formData.time_off_type_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration: parseFloat(formData.duration),
        reason: formData.reason.trim(),
      };

      const response = await axiosClient.post('/time-off/requests', payload);
      addToast('Time off request submitted for approval!', 'success');
      if (onSubmit) onSubmit(response.data);
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      setError(err.response?.data?.error?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Spinner size="md" />
        <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading employees and leave types...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <Alert type="error">{error}</Alert>}

      <Select
        label="Employee *"
        value={formData.employee_id}
        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
        error={errors.employee_id}
        disabled={!isElevated && !!formData.employee_id}
        options={employees.map((emp) => ({
          value: String(emp.id),
          label: `${emp.first_name} ${emp.last_name} (${emp.employee_code || `EMP-${emp.id}`})`,
        }))}
      />

      <div>
        <Select
          label="Leave Type *"
          value={formData.time_off_type_id}
          onChange={(e) => setFormData({ ...formData, time_off_type_id: e.target.value })}
          error={errors.time_off_type_id}
          options={types.map((t) => ({
            value: String(t.id),
            label: `${t.name} (${t.unit || 'Days'})`,
          }))}
        />
        {(() => {
          const selectedType = types.find((t) => String(t.id) === String(formData.time_off_type_id));
          if (!selectedType) return null;
          return (
            <div style={{
              fontSize: '0.75rem',
              marginTop: '4px',
              color: selectedType.requires_allocation ? '#2563EB' : '#059669',
              fontWeight: 500,
            }}>
              {selectedType.requires_allocation 
                ? 'ℹ️ Quota-based leave: An approved allocation balance is required to take this leave.' 
                : '✓ Direct leave: No allocation quota required.'}
            </div>
          );
        })()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Start Date *"
          type="date"
          value={formData.start_date}
          onChange={(e) => handleDateChange('start_date', e.target.value)}
          error={errors.start_date}
        />
        <Input
          label="End Date *"
          type="date"
          value={formData.end_date}
          onChange={(e) => handleDateChange('end_date', e.target.value)}
          error={errors.end_date}
        />
      </div>

      <Input
        label="Duration (Days) *"
        type="number"
        step="0.5"
        min="0.5"
        value={formData.duration}
        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
        error={errors.duration}
      />

      <Input
        label="Reason / Purpose *"
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        error={errors.reason}
        placeholder="Reason for requested leave..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} icon={Save}>
          Submit Leave Request
        </Button>
      </div>
    </form>
  );
};

export default RequestForm;
