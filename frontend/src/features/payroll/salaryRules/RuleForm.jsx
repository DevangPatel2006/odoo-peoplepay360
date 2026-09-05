import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../../components/ui';
import { Save } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import { useApp } from '../../../store';

export const RuleForm = ({ structureId, rule, onSave, onCancel }) => {
  const { addToast } = useApp();
  const isEditing = Boolean(rule?.id);

  const [formData, setFormData] = useState({
    name: rule?.name || '',
    code: rule?.code || '',
    category: rule?.category || 'Allowance',
    sequence: rule?.sequence ? String(rule.sequence) : '10',
    computation_method: rule?.computation_method || 'Fixed',
    fixed_amount: rule?.fixed_amount !== null && rule?.fixed_amount !== undefined ? String(rule.fixed_amount) : '',
    percentage_value: rule?.percentage_value !== null && rule?.percentage_value !== undefined ? String(rule.percentage_value) : '',
    percentage_base: rule?.percentage_base || 'Wage',
    formula_expression: rule?.formula_expression || '',
    is_active: rule?.is_active ?? true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Rule name is required';
    if (!formData.code.trim()) newErrors.code = 'Rule code is required';
    if (!formData.sequence) newErrors.sequence = 'Evaluation sequence is required';

    if (formData.computation_method === 'Fixed' && (!formData.fixed_amount || isNaN(formData.fixed_amount))) {
      newErrors.fixed_amount = 'Fixed amount is required';
    }
    if (formData.computation_method === 'Percentage') {
      if (!formData.percentage_value || isNaN(formData.percentage_value)) {
        newErrors.percentage_value = 'Percentage value is required';
      }
      if (!formData.percentage_base) {
        newErrors.percentage_base = 'Percentage base is required';
      }
    }
    if (formData.computation_method === 'Formula' && !formData.formula_expression.trim()) {
      newErrors.formula_expression = 'Formula expression is required';
    }

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
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        sequence: parseInt(formData.sequence, 10),
        computation_method: formData.computation_method,
        fixed_amount: formData.computation_method === 'Fixed' ? parseFloat(formData.fixed_amount) : null,
        percentage_value: formData.computation_method === 'Percentage' ? parseFloat(formData.percentage_value) : null,
        percentage_base: formData.computation_method === 'Percentage' ? formData.percentage_base : null,
        formula_expression: formData.computation_method === 'Formula' ? formData.formula_expression.trim() : null,
        is_active: formData.is_active,
      };

      let response;
      if (isEditing) {
        response = await axiosClient.patch(`/salary-rules/${rule.id}`, payload);
        addToast(`Salary rule "${payload.code}" updated successfully!`, 'success');
      } else {
        response = await axiosClient.post(`/salary-rules/structure/${structureId}`, payload);
        addToast(`Salary rule "${payload.code}" added to structure!`, 'success');
      }

      if (onSave) onSave(response.data);
    } catch (err) {
      console.error('Failed to save salary rule:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save salary rule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {apiError && <Alert type="error">{apiError}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Rule Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. House Rent Allowance"
        />
        <Input
          label="Rule Code *"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          error={errors.code}
          placeholder="e.g. HRA"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Select
          label="Category *"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'Basic', label: 'Basic' },
            { value: 'Allowance', label: 'Allowance' },
            { value: 'Gross', label: 'Gross' },
            { value: 'Deduction', label: 'Deduction' },
            { value: 'Net', label: 'Net' },
          ]}
        />
        <Input
          label="Evaluation Sequence *"
          type="number"
          value={formData.sequence}
          onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
          error={errors.sequence}
          helpText="Order evaluated in computation (10, 20, 30...)"
        />
      </div>

      <Select
        label="Computation Method *"
        value={formData.computation_method}
        onChange={(e) => setFormData({ ...formData, computation_method: e.target.value })}
        options={[
          { value: 'Fixed', label: 'Fixed Amount ($)' },
          { value: 'Percentage', label: 'Percentage (%) of Base' },
          { value: 'Formula', label: 'Python / JS Formula' },
        ]}
      />

      {formData.computation_method === 'Fixed' && (
        <Input
          label="Fixed Amount ($) *"
          type="number"
          step="0.01"
          value={formData.fixed_amount}
          onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
          error={errors.fixed_amount}
          placeholder="e.g. 2500.00"
        />
      )}

      {formData.computation_method === 'Percentage' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Percentage Value (%) *"
            type="number"
            step="0.01"
            value={formData.percentage_value}
            onChange={(e) => setFormData({ ...formData, percentage_value: e.target.value })}
            error={errors.percentage_value}
            placeholder="e.g. 40"
          />
          <Select
            label="Percentage Base *"
            value={formData.percentage_base}
            onChange={(e) => setFormData({ ...formData, percentage_base: e.target.value })}
            error={errors.percentage_base}
            options={[
              { value: 'Wage', label: 'Base Contract Wage' },
              { value: 'Basic', label: 'Basic Salary' },
              { value: 'Gross', label: 'Gross Salary' },
            ]}
          />
        </div>
      )}

      {formData.computation_method === 'Formula' && (
        <Input
          label="Formula Expression *"
          value={formData.formula_expression}
          onChange={(e) => setFormData({ ...formData, formula_expression: e.target.value })}
          error={errors.formula_expression}
          placeholder='result = categories["BASIC"] + categories["ALLOWANCE"]'
          helpText='Reference evaluated categories e.g. result = categories["GROSS"] - categories["DEDUCTION"]'
        />
      )}

      <Select
        label="Rule Status"
        value={formData.is_active ? 'true' : 'false'}
        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
        options={[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          {isEditing ? 'Update Rule' : 'Add Rule'}
        </Button>
      </div>
    </form>
  );
};

export default RuleForm;
