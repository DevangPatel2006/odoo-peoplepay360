import React from 'react';
import { Modal, Badge, Button, Card } from '../../components/ui';
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
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeDetailModal = ({ employee, isOpen, onClose, onEdit }) => {
  const navigate = useNavigate();

  if (!employee) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
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
        <h4 style={{ marginBottom: '12px', color: '#0F172A' }}>Connected Module Smart Hub</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
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
              {employee.activeContract?.wage || '$8,500.00 / mo'}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Status: <span style={{ color: '#059669', fontWeight: 600 }}>Running</span>
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
              168 Worked Hours
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              21 / 22 Days Present
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
              14 Days Paid Leave
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Remaining Balance
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
              20 Days Allocated
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              6 Used • 14 Available
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
              12 Generated
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Last Net: $6,840.00
            </div>
          </div>

        </div>
      </div>

      {/* MASTER RECORD DETAILS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Work Contact</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.email}</div>
          <div className="text-xs text-secondary">{employee.phone || '+1 (555) 234-5678'}</div>
        </div>

        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Reporting Line</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.manager || 'Sarah Jenkins'}</div>
          <div className="text-xs text-secondary">HR Director</div>
        </div>

        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div className="text-xs text-muted font-medium">Direct Deposit Details</div>
          <div className="text-sm font-semibold" style={{ marginTop: '4px' }}>{employee.bankAccount || 'US89370001928374'}</div>
          <div className="text-xs text-success">Verified Routing</div>
        </div>
      </div>
    </Modal>
  );
};
