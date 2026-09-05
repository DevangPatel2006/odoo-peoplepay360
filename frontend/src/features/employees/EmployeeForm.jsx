import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Alert, Spinner } from '../../components/ui';
import { Save, User, Briefcase, Building, Clock } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const EmployeeForm = ({ employee, onSave, onCancel }) => {
  const { addToast } = useApp();
  const isEditing = Boolean(employee?.dbId || (employee?.id && typeof employee.id === 'number'));
  const targetId = employee?.dbId || employee?.id;

  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || employee?.id || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    first_name: employee?.firstName || employee?.first_name || '',
    last_name: employee?.lastName || employee?.last_name || '',
    work_email: employee?.email || employee?.work_email || '',
    personal_phone: employee?.phone || employee?.personal_phone || '',
    date_of_joining: employee?.hireDate || (employee?.date_of_joining ? String(employee.date_of_joining).split('T')[0] : new Date().toISOString().split('T')[0]),
    employee_type: employee?.employeeType || employee?.employee_type || 'Full-time',
    department_id: employee?.department_id ? String(employee.department_id) : '',
    job_position_id: employee?.job_position_id ? String(employee.job_position_id) : '',
    manager_id: employee?.manager_id ? String(employee.manager_id) : '',
    working_schedule_id: employee?.working_schedule_id ? String(employee.working_schedule_id) : '',
    bank_account_number: employee?.bankAccount || employee?.bank_account_number || '',
    status: employee?.status || 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      setLoadingMeta(true);
      try {
        const [deptRes, posRes, schedRes, mgrRes] = await Promise.all([
          axiosClient.get('/departments').catch(() => ({ data: [] })),
          axiosClient.get('/job-positions').catch(() => ({ data: [] })),
          axiosClient.get('/working-schedules').catch(() => ({ data: [] })),
          axiosClient.get('/employees').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const deptList = Array.isArray(deptRes.data) ? deptRes.data : [];
        const posList = Array.isArray(posRes.data) ? posRes.data : [];
        const schedList = Array.isArray(schedRes.data) ? schedRes.data : [];
        const mgrList = Array.isArray(mgrRes.data) ? mgrRes.data : [];

        setDepartments(deptList);
        setJobPositions(posList);
        setSchedules(schedList);
        setManagers(mgrList);

        if (!employee) {
          setFormData((prev) => ({
            ...prev,
            department_id: prev.department_id || (deptList[0] ? String(deptList[0].id) : ''),
            job_position_id: prev.job_position_id || (posList[0] ? String(posList[0].id) : ''),
            working_schedule_id: prev.working_schedule_id || (schedList[0] ? String(schedList[0].id) : ''),
          }));
        }
      } catch (err) {
        console.error('Failed to load employee form metadata:', err);
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    fetchMetadata();
    return () => { isMounted = false; };
  }, [employee]);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.work_email.trim()) {
      newErrors.work_email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.work_email)) {
      newErrors.work_email = 'Enter a valid email address';
    }
    if (!formData.date_of_joining) newErrors.date_of_joining = 'Hire date is required';

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
      const payload = {
        employee_code: formData.employee_code,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        work_email: formData.work_email.trim(),
        personal_phone: formData.personal_phone ? formData.personal_phone.trim() : null,
        date_of_joining: formData.date_of_joining,
        employee_type: formData.employee_type,
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        job_position_id: formData.job_position_id ? parseInt(formData.job_position_id, 10) : null,
        manager_id: formData.manager_id ? parseInt(formData.manager_id, 10) : null,
        working_schedule_id: formData.working_schedule_id ? parseInt(formData.working_schedule_id, 10) : null,
        bank_account_number: formData.bank_account_number ? formData.bank_account_number.trim() : null,
        status: formData.status,
      };

      let res;
      if (isEditing) {
        res = await axiosClient.patch(`/employees/${targetId}`, payload);
        addToast(`Updated employee profile for ${formData.first_name} ${formData.last_name}`, 'success');
      } else {
        res = await axiosClient.post('/employees', payload);
        addToast(`Created new employee record for ${formData.first_name} ${formData.last_name}`, 'success');
      }

      if (onSave) onSave(res.data);
    } catch (err) {
      console.error('Failed to save employee:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save employee profile.');
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

      {/* SECTION 1: Personal Information */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <User size={18} />
          <span>1. Personal & Contact Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="First Name *"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            error={errors.first_name}
            placeholder="e.g. Alexander"
          />
          <Input
            label="Last Name *"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            error={errors.last_name}
            placeholder="e.g. Wright"
          />
          <Input
            label="Work Email *"
            type="email"
            value={formData.work_email}
            onChange={(e) => handleChange('work_email', e.target.value)}
            error={errors.work_email}
            placeholder="alex.w@peoplepay360.com"
          />
          <Input
            label="Phone Number"
            value={formData.personal_phone}
            onChange={(e) => handleChange('personal_phone', e.target.value)}
            placeholder="+1 (555) 019-2834"
          />
        </div>
      </div>

      {/* SECTION 2: Employment Information */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Briefcase size={18} />
          <span>2. Employment Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Employee Code / ID *"
            value={formData.employee_code}
            onChange={(e) => handleChange('employee_code', e.target.value)}
            disabled={isEditing}
          />
          <Input
            label="Hire Date *"
            type="date"
            value={formData.date_of_joining}
            onChange={(e) => handleChange('date_of_joining', e.target.value)}
            error={errors.date_of_joining}
          />
          <Select
            label="Employee Type *"
            value={formData.employee_type}
            onChange={(e) => handleChange('employee_type', e.target.value)}
            options={[
              { value: 'Full-time', label: 'Full-time Permanent' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Contract', label: 'Contract / Temporary' },
              { value: 'Intern', label: 'Intern' },
            ]}
          />
        </div>
      </div>

      {/* SECTION 3: Organization Hierarchy */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Building size={18} />
          <span>3. Organization & Hierarchy</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Department"
            value={formData.department_id}
            onChange={(e) => handleChange('department_id', e.target.value)}
            options={[
              { value: '', label: 'Select Department...' },
              ...departments.map((d) => ({ value: String(d.id), label: d.name }))
            ]}
          />
          <Select
            label="Job Position"
            value={formData.job_position_id}
            onChange={(e) => handleChange('job_position_id', e.target.value)}
            options={[
              { value: '', label: 'Select Position...' },
              ...jobPositions.map((p) => ({ value: String(p.id), label: `${p.title} (${p.department_name || 'General'})` }))
            ]}
          />
          <Select
            label="Reporting Manager"
            value={formData.manager_id}
            onChange={(e) => handleChange('manager_id', e.target.value)}
            options={[
              { value: '', label: 'No Direct Manager' },
              ...managers
                .filter((m) => !targetId || m.id !== targetId)
                .map((m) => ({
                  value: String(m.id),
                  label: `${m.first_name} ${m.last_name} (${m.job_position_title || 'Lead'})`
                }))
            ]}
          />
        </div>
      </div>

      {/* SECTION 4 & 5: Working Schedule & Direct Deposit */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Clock size={18} />
          <span>4. Working Schedule & Direct Deposit</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Working Schedule"
            value={formData.working_schedule_id}
            onChange={(e) => handleChange('working_schedule_id', e.target.value)}
            options={[
              { value: '', label: 'Default Company Schedule' },
              ...schedules.map((s) => ({ value: String(s.id), label: `${s.name} (${s.hours_per_week || 40}h/week)` }))
            ]}
          />
          <Input
            label="Bank Account / IBAN"
            value={formData.bank_account_number}
            onChange={(e) => handleChange('bank_account_number', e.target.value)}
            placeholder="US89370001928374"
            helpText="Required for payroll direct deposit"
          />
          <Select
            label="Employee Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Archived', label: 'Archived' },
            ]}
          />
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} icon={Save}>
          {isEditing ? 'Save Changes' : 'Create Employee Record'}
        </Button>
      </div>
    </form>
  );
};
