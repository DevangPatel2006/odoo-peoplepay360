import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../../components/ui';
import { Save } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import { useApp } from '../../../store';

export const StructureForm = ({ structure, onSave, onCancel }) => {
  const { addToast } = useApp();
  const isEditing = Boolean(structure?.id);

  const [formData, setFormData] = useState({
    name: structure?.name || '',
    structure_type: structure?.structure_type || 'Regular',
    is_active: structure?.is_active ?? true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Structure name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      const payload = {
        name: formData.name.trim(),
        structure_type: formData.structure_type,
        is_active: formData.is_active,
      };

      let response;
      if (isEditing) {
        response = await axiosClient.patch(`/salary-structures/${structure.id}`, payload);
        addToast(`Salary structure "${payload.name}" updated successfully!`, 'success');
      } else {
        response = await axiosClient.post('/salary-structures', payload);
        addToast(`Salary structure "${payload.name}" created successfully!`, 'success');
      }

      if (onSave) onSave(response.data);
    } catch (err) {
      console.error('Failed to save salary structure:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save salary structure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {apiError && <Alert type="error">{apiError}</Alert>}

      <Input
        label="Structure Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="e.g. Regular Salary Structure"
      />

      <Select
        label="Structure Type *"
        value={formData.structure_type}
        onChange={(e) => setFormData({ ...formData, structure_type: e.target.value })}
        options={[
          { value: 'Regular', label: 'Regular (Full-time Employees)' },
          { value: 'Intern', label: 'Intern (Fixed Allowance & Stipend)' },
          { value: 'Executive', label: 'Executive (Leadership Structure)' },
          { value: 'Contractor', label: 'Contractor (Hourly / Retainer)' },
        ]}
      />

      <Select
        label="Status"
        value={formData.is_active ? 'true' : 'false'}
        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
        options={[
          { value: 'true', label: 'Active (Available for Contracts)' },
          { value: 'false', label: 'Inactive / Archived' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          {isEditing ? 'Update Structure' : 'Create Structure'}
        </Button>
      </div>
    </form>
  );
};

export default StructureForm;
