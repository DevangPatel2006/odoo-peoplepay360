import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Alert, Spinner } from '../../components/ui';
import { Save } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const AttendanceForm = ({ attendance, onSave, onCancel, userRole = 'admin' }) => {
  const { addToast } = useApp();
  const isEditing = Boolean(attendance?.dbId || (attendance?.id && typeof attendance.id === 'number'));
  const targetId = attendance?.dbId || attendance?.id;

  const [employees, setEmployees] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(!attendance);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState(() => {
    // Derive initial check-in/check-out times from real backend column names
    let initCheckIn = '09:00';
    let initCheckOut = '17:00';
    if (attendance?.check_in_at) {
      try { initCheckIn = new Date(attendance.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { /* fallback */ }
    } else if (attendance?.checkIn && attendance.checkIn !== '—') {
      initCheckIn = attendance.checkIn;
    }
    if (attendance?.check_out_at) {
      try { initCheckOut = new Date(attendance.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { /* fallback */ }
    } else if (attendance?.checkOut && attendance.checkOut !== 'In Progress' && attendance.checkOut !== '—') {
      initCheckOut = attendance.checkOut;
    }

    return {
      employee_id: attendance?.employee_id ? String(attendance.employee_id) : '',
      attendance_date: attendance?.date || (attendance?.attendance_date ? String(attendance.attendance_date).split('T')[0] : new Date().toISOString().split('T')[0]),
      check_in_time: initCheckIn,
      check_out_time: initCheckOut,
      status: attendance?.status || 'Present',
      notes: attendance?.notes || '',
    };
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchEmployees = async () => {
      try {
        const response = await axiosClient.get('/employees');
        const list = Array.isArray(response.data) ? response.data : [];
        if (isMounted) {
          setEmployees(list);
          if (!attendance && list.length > 0 && !formData.employee_id) {
            setFormData((prev) => ({ ...prev, employee_id: String(list[0].id) }));
          }
        }
      } catch (err) {
        console.error('Failed to load employees for attendance:', err);
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    fetchEmployees();
    return () => { isMounted = false; };
  }, [attendance]);

  const validate = () => {
    const newErrors = {};
    if (!isEditing && !formData.employee_id) newErrors.employee_id = 'Employee is required';
    if (!formData.attendance_date) newErrors.attendance_date = 'Date is required';
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
      const checkInIso = formData.check_in_time 
        ? `${formData.attendance_date}T${formData.check_in_time}:00Z` 
        : null;
      const checkOutIso = formData.check_out_time 
        ? `${formData.attendance_date}T${formData.check_out_time}:00Z` 
        : null;

      let res;
      if (isEditing) {
        const payload = {
          check_in_at: checkInIso,
          check_out_at: checkOutIso,
          status: formData.status,
          notes: formData.notes.trim() || null,
          is_manual_correction: true,
        };
        res = await axiosClient.patch(`/attendance/${targetId}`, payload);
        addToast('Attendance record corrected successfully!', 'success');
      } else {
        const payload = {
          employee_id: Number(formData.employee_id),
          attendance_date: formData.attendance_date,
          check_in_at: checkInIso,
          check_out_at: checkOutIso,
          status: formData.status,
          notes: formData.notes.trim() || null,
        };
        res = await axiosClient.post('/attendance', payload);
        addToast('Attendance record created successfully!', 'success');
      }

      if (onSave) onSave(res.data);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      setApiError(err.response?.data?.error?.message || 'Failed to save attendance record.');
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {apiError && <Alert type="error">{apiError}</Alert>}

      {isEditing ? (
        <Input
          label="Employee"
          value={attendance?.employeeName || 'Employee'}
          disabled
        />
      ) : (
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
      )}

      <Input
        label="Attendance Date *"
        type="date"
        value={formData.attendance_date}
        onChange={(e) => handleChange('attendance_date', e.target.value)}
        error={errors.attendance_date}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Check-In Time"
          type="time"
          value={formData.check_in_time}
          onChange={(e) => handleChange('check_in_time', e.target.value)}
        />
        <Input
          label="Check-Out Time"
          type="time"
          value={formData.check_out_time}
          onChange={(e) => handleChange('check_out_time', e.target.value)}
        />
      </div>

      <Select
        label="Attendance Status"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={[
          { value: 'Present', label: 'Present' },
          { value: 'Late', label: 'Late' },
          { value: 'Absent', label: 'Absent' },
          { value: 'On Leave', label: 'On Leave' },
        ]}
      />

      <Input
        label="Notes / Reason"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Reason for correction or entry notes..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} icon={Save}>
          {isEditing ? 'Save Correction' : 'Log Attendance'}
        </Button>
      </div>
    </form>
  );
};

export default AttendanceForm;
