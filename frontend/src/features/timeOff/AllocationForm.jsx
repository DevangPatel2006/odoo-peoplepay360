import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert } from '../../components/ui';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const AllocationForm = ({ isOpen, onClose, onSave, initialData }) => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [timeOffTypes, setTimeOffTypes] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: '',
    time_off_type_id: '',
    allocated_amount: '',
    validity_start: new Date().toISOString().split('T')[0],
    validity_end: '',
    description: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load available employees and time off types for select dropdowns
    const loadDependencies = async () => {
      try {
        const [empRes, typesRes] = await Promise.all([
          axiosClient.get('/employees').catch(() => ({ data: [] })),
          axiosClient.get('/time-off/types').catch(() => ({ data: [] })),
        ]);
        const empList = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
        const typesList = Array.isArray(typesRes.data) ? typesRes.data : (typesRes.data?.data || []);
        setEmployees(empList);
        setTimeOffTypes(typesList);

        if (!initialData && empList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            employee_id: prev.employee_id || empList[0].id,
            time_off_type_id: prev.time_off_type_id || (typesList[0]?.id || ''),
          }));
        }
      } catch (err) {
        console.error('Failed to load allocation dependencies:', err);
      }
    };

    loadDependencies();

    if (initialData) {
      setFormData({
        employee_id: initialData.employee_id || '',
        time_off_type_id: initialData.time_off_type_id || '',
        allocated_amount: initialData.allocated_amount || initialData.allocated || '',
        validity_start: initialData.validity_start ? String(initialData.validity_start).split('T')[0] : '',
        validity_end: initialData.validity_end ? String(initialData.validity_end).split('T')[0] : '',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        employee_id: '',
        time_off_type_id: '',
        allocated_amount: '',
        validity_start: new Date().toISOString().split('T')[0],
        validity_end: '',
        description: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      employee_id: parseInt(formData.employee_id, 10),
      time_off_type_id: parseInt(formData.time_off_type_id, 10),
      allocated_amount: parseFloat(formData.allocated_amount),
      validity_start: formData.validity_start || null,
      validity_end: formData.validity_end || null,
      description: formData.description || null,
    };

    try {
      let saved;
      if (initialData?.id) {
        const res = await axiosClient.put(`/time-off/allocations/${initialData.id}`, payload);
        saved = res.data;
        addToast('Allocation updated successfully', 'success');
      } else {
        const res = await axiosClient.post('/time-off/allocations', payload);
        saved = res.data;
        addToast('Leave allocation created successfully', 'success');
      }
      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save allocation:', err);
      setError(err.response?.data?.error?.message || 'Failed to save allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Leave Allocation' : 'Create Leave Allocation'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label className="input-label">Target Employee</label>
          <Select
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            required
          >
            <option value="">Select Employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name || ''} {emp.last_name || ''} ({emp.employee_code || `EMP-${emp.id}`})
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="input-label">Leave Type</label>
            <Select
              value={formData.time_off_type_id}
              onChange={(e) => setFormData({ ...formData, time_off_type_id: e.target.value })}
              required
            >
              <option value="">Select Leave Type...</option>
              {timeOffTypes.map((tot) => (
                <option key={tot.id} value={tot.id}>
                  {tot.name} ({tot.unit || 'Days'})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Allocated Amount"
            type="number"
            step="0.5"
            min="0.5"
            value={formData.allocated_amount}
            onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
            placeholder="e.g. 20"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Validity Start"
            type="date"
            value={formData.validity_start}
            onChange={(e) => setFormData({ ...formData, validity_start: e.target.value })}
          />

          <Input
            label="Validity End"
            type="date"
            value={formData.validity_end}
            onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
          />
        </div>

        <Input
          label="Reason / Allocation Note"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g. Annual Vacation entitlement 2026"
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {initialData ? 'Update Allocation' : 'Create Allocation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AllocationForm;
