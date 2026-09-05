import React, { useState, useEffect } from 'react';
import { Modal, Badge, Button, Spinner } from '../../components/ui';
import { 
  FileText, 
  Clock, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Mail, 
  Phone, 
  CreditCard, 
  ArrowRight,
  ExternalLink,
  Edit,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const EmployeeDetailModal = ({ employee, isOpen, onClose, onEdit, onResetCredentials }) => {
  const navigate = useNavigate();
  const { user, addToast } = useApp();
  const empId = employee?.dbId || employee?.id;
  const [resetting, setResetting] = useState(false);
  const canManageEmployees = user?.role ? user.role !== 'Employee' : true;

  const [liveStats, setLiveStats] = useState({
    contract: null,
    attendanceCount: 0,
    workedHours: 0,
    leaveDaysUsed: 0,
    allocatedDays: 0,
    availableDays: 0,
    payslipCount: 0,
    lastNetSalary: null,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!isOpen || !empId) return;

    let isMounted = true;
    const loadSmartStats = async () => {
      setLoadingStats(true);
      try {
        const [contractsRes, attRes, timeOffRes, allocRes, payslipsRes] = await Promise.all([
          axiosClient.get(`/employees/${empId}/contracts`).catch(() => ({ data: [] })),
          axiosClient.get(`/employees/${empId}/attendance`).catch(() => ({ data: [] })),
          axiosClient.get(`/employees/${empId}/time-off`).catch(() => ({ data: [] })),
          axiosClient.get(`/employees/${empId}/allocations`).catch(() => ({ data: [] })),
          axiosClient.get(`/payslips?employee_id=${empId}`).catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : (contractsRes.data?.data || []);
        const activeContract = contracts.find((c) => c.status === 'Running') || contracts[0] || null;

        const attendances = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.data || []);
        const workedHoursSum = attendances.reduce((sum, a) => sum + parseFloat(a.worked_hours || 0), 0);
        const presentCount = attendances.filter((a) => a.status === 'Present' || a.status === 'Late').length;

        const leaves = Array.isArray(timeOffRes.data) ? timeOffRes.data : (timeOffRes.data?.data || []);
        const leaveDays = leaves
          .filter((l) => l.status === 'Approved')
          .reduce((sum, l) => sum + parseFloat(l.duration || 0), 0);

        const allocs = Array.isArray(allocRes.data) ? allocRes.data : (allocRes.data?.data || []);
        const totalAllocated = allocs.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);
        const totalRemaining = allocs.reduce((sum, a) => sum + parseFloat(a.remaining_amount ?? (a.allocated_amount - (a.taken_amount || 0))), 0);

        const slips = Array.isArray(payslipsRes.data) ? payslipsRes.data : (payslipsRes.data?.data || []);
        const lastSlip = slips[0];

        setLiveStats({
          contract: activeContract,
          attendanceCount: presentCount,
          workedHours: Math.round(workedHoursSum * 10) / 10,
          leaveDaysUsed: leaveDays,
          allocatedDays: totalAllocated,
          availableDays: totalRemaining,
          payslipCount: slips.length,
          lastNetSalary: lastSlip ? parseFloat(lastSlip.net_amount || 0) : null,
        });
      } catch (err) {
        console.error('Failed to load employee smart stats:', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    loadSmartStats();
    return () => { isMounted = false; };
  }, [isOpen, empId]);

  if (!employee) return null;

  const handleNavigate = (path) => {
    onClose();
    const query = empId ? `?employee_id=${empId}` : '';
    navigate(`${path}${query}`);
  };

  const handleResetCredentials = async () => {
    if (!empId) return;
    setResetting(true);
    try {
      const res = await axiosClient.post(`/employees/${empId}/reset-credentials`);
      addToast(`Credentials reset successfully for ${employee.name || employee.firstName}`, 'success');
      onClose();
      onResetCredentials?.({
        showCredentials: true,
        tempPassword: res.data?.temporary_password,
        email: res.data?.account?.work_email || employee.email,
        welcomeEmail: res.data?.welcome_email,
      });
    } catch (err) {
      console.error('Failed to reset credentials:', err);
      addToast(err.response?.data?.error?.message || 'Failed to reset employee credentials.', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Central HR Hub & Master Record"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canManageEmployees && (
            <Button
              variant="secondary"
              icon={Key}
              onClick={handleResetCredentials}
              loading={resetting}
            >
              Reset Credentials
            </Button>
          )}
          <Button variant="accent" icon={Edit} onClick={() => { onClose(); onEdit(employee); }}>
            Edit Employee Record
          </Button>
        </>
      }
    >
      {/* HEADER SECTION */}
      <div style={{
        padding: '20px',
        backgroundColor: '#172554',
        color: '#ffffff',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#7C3AED',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            {employee.name ? employee.name.split(' ').map(n => n[0]).join('') : 'E'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff' }}>{employee.name}</h2>
              <Badge variant={employee.status === 'Active' ? 'success' : 'warning'}>
                {employee.status}
              </Badge>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '2px' }}>
              ID: <strong>{employee.id || employee.employeeId}</strong> • {employee.position} ({employee.department})
            </div>
          </div>
        </div>
      </div>

      {/* CONNECTED SMART HUB CARDS (5 Core Modules) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ color: '#0F172A', margin: 0 }}>Connected Module Smart Hub</h4>
          {loadingStats && <span className="text-xs text-muted">Updating live metrics...</span>}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          {/* 1. CONTRACTS CARD */}
          <div 
            onClick={() => handleNavigate('/contracts')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 150ms ease'
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#7C3AED', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>1. CONTRACT</span>
              <FileText size={18} />
            </div>
            <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {liveStats.contract ? `$${parseFloat(liveStats.contract.wage_per_month).toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo` : (employee.active_contract_wage ? `$${parseFloat(employee.active_contract_wage).toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo` : 'No Active Contract')}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Status: <span style={{ color: liveStats.contract?.status === 'Running' ? '#059669' : '#D97706', fontWeight: 600 }}>{liveStats.contract?.status || 'None'}</span>
            </div>
          </div>

          {/* 2. ATTENDANCE CARD */}
          <div 
            onClick={() => handleNavigate('/attendance')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 150ms ease'
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#3B82F6', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>2. ATTENDANCE</span>
              <Clock size={18} />
            </div>
            <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {liveStats.workedHours} Worked Hours
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              {liveStats.attendanceCount} Recorded Days Present
            </div>
          </div>

          {/* 3. TIME OFF CARD */}
          <div 
            onClick={() => handleNavigate('/time-off')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 150ms ease'
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#D97706', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>3. TIME OFF</span>
              <Calendar size={18} />
            </div>
            <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {liveStats.leaveDaysUsed} Days Taken
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Approved Leave Requests
            </div>
          </div>

          {/* 4. ALLOCATIONS CARD */}
          <div 
            onClick={() => handleNavigate('/time-off')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 150ms ease'
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>4. ALLOCATIONS</span>
              <Calendar size={18} />
            </div>
            <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {liveStats.availableDays} Days Available
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              {liveStats.allocatedDays} Total Allocated
            </div>
          </div>

          {/* 5. PAYSLIPS CARD */}
          <div 
            onClick={() => handleNavigate('/payroll')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 150ms ease'
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#172554', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>5. PAYSLIPS</span>
              <DollarSign size={18} />
            </div>
            <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {liveStats.payslipCount} Generated
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              {liveStats.lastNetSalary != null ? `Last Net: $${liveStats.lastNetSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'No Payslips Yet'}
            </div>
          </div>

        </div>
      </div>

      {/* MASTER RECORD DETAILS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Work Contact</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.email || 'N/A'}</div>
          <div className="text-xs text-secondary">{employee.phone || 'No phone recorded'}</div>
        </div>

        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Reporting Line & Schedule</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.manager || 'Executive'}</div>
          <div className="text-xs text-secondary">{employee.schedule || 'Standard 40h/week'}</div>
        </div>

        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Direct Deposit Details</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.bankAccount || 'None configured'}</div>
          <div className="text-xs text-success">{employee.bankAccount ? 'Configured Direct Deposit' : 'Pending Bank Details'}</div>
        </div>
      </div>
    </Modal>
  );
};
