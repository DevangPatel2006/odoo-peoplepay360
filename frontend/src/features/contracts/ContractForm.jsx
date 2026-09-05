import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Alert, Spinner } from '../../components/ui';
import { Save, FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const ContractForm = ({ contract, onSave, onCancel }) => {
  const { addToast } = useApp();
  const isEditing = Boolean(contract?.dbId || (contract?.id && typeof contract.id === 'number'));
  const targetId = contract?.dbId || contract?.id;

  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState({
    contract_number: contract?.contractName || contract?.contract_number || `CON/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    employee_id: contract?.employee_id ? String(contract.employee_id) : '',
    start_date: contract?.startDate ? String(contract.startDate).split('T')[0] : (contract?.start_date ? String(contract.start_date).split('T')[0] : new Date().toISOString().split('T')[0]),
    end_date: contract?.endDate && contract.endDate !== 'Ongoing' ? String(contract.endDate).split('T')[0] : (contract?.end_date ? String(contract.end_date).split('T')[0] : ''),
    wage_per_month: contract?.wage || contract?.wage_per_month || '',
    salary_structure_id: contract?.salary_structure_id ? String(contract.salary_structure_id) : '',
    working_schedule_id: contract?.working_schedule_id ? String(contract.working_schedule_id) : '',
    status: contract?.status || 'Running',
    notes: contract?.notes || '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      setLoadingMeta(true);
      try {
        const [empRes, structRes, schedRes] = await Promise.all([
          axiosClient.get('/employees').catch(() => ({ data: [] })),
          axiosClient.get('/salary-structures').catch(() => ({ data: [] })),
          axiosClient.get('/working-schedules').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const empList = Array.isArray(empRes.data) ? empRes.data : [];
        const structList = Array.isArray(structRes.data) ? structRes.data : [];
        const schedList = Array.isArray(schedRes.data) ? schedRes.data : [];

        setEmployees(empList);
        setStructures(structList);
        setSchedules(schedList);

        if (!contract) {
          setFormData((prev) => ({
            ...prev,
            employee_id: prev.employee_id || (empList[0] ? String(empList[0].id) : ''),
            salary_structure_id: prev.salary_structure_id || (structList[0] ? String(structList[0].id) : ''),
            working_schedule_id: prev.working_schedule_id || (schedList[0] ? String(schedList[0].id) : ''),
          }));
        }
      } catch (err) {
        console.error('Failed to load contract dependencies:', err);
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    loadMetadata();
    return () => { isMounted = false; };
  }, [contract]);

  const validate = () => {
    const newErrors = {};
    if (!formData.employee_id) newErrors.employee_id = 'Employee selection is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.wage_per_month || parseFloat(formData.wage_per_month) <= 0) {
      newErrors.wage_per_month = 'Valid wage amount is required';
    }
    if (!formData.salary_structure_id) newErrors.salary_structure_id = 'Salary structure is required';

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

    setSubmitting(true);
    setApiError('');
    try {
      const selectedEmp = employees.find((e) => String(e.id) === String(formData.employee_id));

      const payload = {
        contract_number: formData.contract_number.trim(),
        employee_id: Number(formData.employee_id),
        department_id: selectedEmp?.department_id || null,
        job_position_id: selectedEmp?.job_position_id || null,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null,
        salary_structure_id: formData.salary_structure_id ? Number(formData.salary_structure_id) : null,
        wage_per_month: parseFloat(formData.wage_per_month),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      let res;
      if (isEditing) {
        res = await axiosClient.patch(`/contracts/${targetId}`, payload);
        addToast(`Contract ${payload.contract_number} updated successfully!`, 'success');
      } else {
        res = await axiosClient.post('/contracts', payload);
        addToast(`Contract ${payload.contract_number} created successfully!`, 'success');
      }

      if (onSave) onSave(res.data);
    } catch (err) {
      console.error('Failed to save contract:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save contract.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Spinner size="md" />
        <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading form dependencies...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {apiError && <Alert type="error">{apiError}</Alert>}

      {/* Contract & Employee Selection */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <FileText size={18} />
          <span>1. Contract Reference & Employee</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Contract Number *"
            value={formData.contract_number}
            onChange={(e) => handleChange('contract_number', e.target.value)}
          />
          <Select
            label="Employee *"
            value={formData.employee_id}
            onChange={(e) => handleChange('employee_id', e.target.value)}
            error={errors.employee_id}
            options={employees.map((emp) => ({
              value: String(emp.id),
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_code || `EMP-${emp.id}`})`,
            }))}
          />
        </div>
      </div>

      {/* Contract Duration */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Calendar size={18} />
          <span>2. Contract Duration & Dates</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Start Date *"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            error={errors.start_date}
          />
          <Input
            label="End Date (Leave empty if open-ended)"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            helpText="Open-ended contract if left blank"
          />
        </div>
      </div>

      {/* Salary & Structure */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <DollarSign size={18} />
          <span>3. Wage & Salary Structure</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Monthly Base Wage ($) *"
            type="number"
            step="0.01"
            value={formData.wage_per_month}
            onChange={(e) => handleChange('wage_per_month', e.target.value)}
            error={errors.wage_per_month}
            placeholder="8500.00"
          />
          <Select
            label="Salary Structure *"
            value={formData.salary_structure_id}
            onChange={(e) => handleChange('salary_structure_id', e.target.value)}
            error={errors.salary_structure_id}
            options={structures.map((s) => ({
              value: String(s.id),
              label: `${s.name} (${s.structure_type || 'Regular'})`,
            }))}
          />
        </div>
      </div>

      {/* Working Schedule & Status */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Clock size={18} />
          <span>4. Working Schedule & Contract Status</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Working Schedule"
            value={formData.working_schedule_id}
            onChange={(e) => handleChange('working_schedule_id', e.target.value)}
            options={schedules.map((sc) => ({
              value: String(sc.id),
              label: sc.name,
            }))}
          />
          <Select
            label="Contract Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'Running', label: 'Running (Active for Payrun Resolver)' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} icon={Save}>
          {isEditing ? 'Update Contract' : 'Save Contract'}
        </Button>
      </div>
    </form>
  );
};

export default ContractForm;
