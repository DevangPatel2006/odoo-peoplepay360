import React, { useState } from 'react';
import { Card, Table, Badge, Button, Alert, Modal, Spinner } from '../../../components/ui';
import { PayslipDetail } from '../payslips/PayslipDetail';
import { 
  Play, 
  CheckCircle2, 
  DollarSign, 
  Mail, 
  AlertTriangle, 
  ArrowRight, 
  Eye, 
  FileText, 
  ShieldCheck, 
  AlertOctagon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';

export const PayrunProcessing = ({ payrunData, onDone }) => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  // State Progression: Draft -> Computed -> Validated -> Paid
  const [payrunStatus, setPayrunStatus] = useState('Draft'); // Draft | Computed | Validated | Paid
  const [loadingAction, setLoadingAction] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Confirmation modal states
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);

  // Payslip records with backend-provided warnings
  const [payslips, setPayslips] = useState([
    {
      id: 'PSL-101',
      employeeName: 'Alexander Wright',
      employeeId: 'EMP-101',
      department: 'Software Engineering',
      position: 'Senior Lead Architect',
      bankAccount: 'US89370001928374',
      workedDays: '22 days',
      gross: 12100.00,
      deductions: -1452.00,
      net: 10648.00,
      status: 'Draft',
      warning: null,
    },
    {
      id: 'PSL-102',
      employeeName: 'Sophia Martinez',
      employeeId: 'EMP-102',
      department: 'Human Resources',
      position: 'HR Specialist',
      bankAccount: 'US89370001928888',
      workedDays: '22 days',
      gross: 8880.00,
      deductions: -1065.60,
      net: 7814.40,
      status: 'Draft',
      warning: null,
    },
    {
      id: 'PSL-103',
      employeeName: 'Marcus Vance',
      employeeId: 'EMP-103',
      department: 'Finance & Accounting',
      position: 'Payroll Accountant',
      bankAccount: 'US89370001929999',
      workedDays: '20 days',
      gross: 10140.00,
      deductions: -1216.80,
      net: 8923.20,
      status: 'Draft',
      warning: { type: 'contract', message: 'Contract expiring in 5 days', link: '/contracts' },
    },
    {
      id: 'PSL-104',
      employeeName: 'Elena Rostova',
      employeeId: 'EMP-104',
      department: 'Sales & Marketing',
      position: 'Marketing Director',
      bankAccount: 'Missing Direct Deposit Info',
      workedDays: '0 days',
      gross: 0.00,
      deductions: 0.00,
      net: 0.00,
      status: 'Draft',
      warning: { type: 'bank', message: 'Missing bank routing details', link: '/employees' },
    },
  ]);

  // Totals calculations
  const totalGross = payslips.reduce((sum, p) => sum + p.gross, 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + p.deductions, 0);
  const totalNet = payslips.reduce((sum, p) => sum + p.net, 0);

  // Workflow Actions
  const handleCompute = () => {
    setLoadingAction('compute');
    setTimeout(() => {
      setLoadingAction(null);
      setPayrunStatus('Computed');
      setPayslips((prev) => prev.map((p) => ({ ...p, status: 'Computed' })));
      addToast('Payrun salary rules evaluated via backend engine!', 'success');
    }, 600);
  };

  const confirmValidate = () => {
    setShowValidateModal(false);
    setLoadingAction('validate');
    setTimeout(() => {
      setLoadingAction(null);
      setPayrunStatus('Validated');
      setPayslips((prev) => prev.map((p) => ({ ...p, status: 'Validated' })));
      addToast('Payrun validated and locked for payment disbursement.', 'success');
    }, 600);
  };

  const confirmMarkPaid = () => {
    setShowPaidModal(false);
    setLoadingAction('paid');
    setTimeout(() => {
      setLoadingAction(null);
      setPayrunStatus('Paid');
      setPayslips((prev) => prev.map((p) => ({ ...p, status: 'Paid' })));
      addToast('Payrun marked as Paid. Direct deposit transfers initiated.', 'success');
    }, 600);
  };

  const handleSendPayslips = () => {
    setLoadingAction('send');
    setTimeout(() => {
      setLoadingAction(null);
      addToast('Bulk PDF payslips sent via email to all employees!', 'info');
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* STATE PROGRESSION HEADER BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* State 1: Draft */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: payrunStatus === 'Draft' ? 1 : 0.7 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: payrunStatus === 'Draft' ? '#D97706' : '#059669',
            color: '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {payrunStatus !== 'Draft' ? '✓' : '1'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>1. Draft Scope</strong>
            <span className="text-xs text-muted">Initial target list</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        {/* State 2: Computed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: payrunStatus === 'Computed' ? 1 : payrunStatus === 'Validated' || payrunStatus === 'Paid' ? 0.7 : 0.5 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: payrunStatus === 'Computed' ? '#7C3AED' : payrunStatus === 'Validated' || payrunStatus === 'Paid' ? '#059669' : '#E2E8F0',
            color: payrunStatus === 'Draft' ? '#64748B' : '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {payrunStatus === 'Validated' || payrunStatus === 'Paid' ? '✓' : '2'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>2. Computed</strong>
            <span className="text-xs text-muted">Formula rules evaluated</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        {/* State 3: Validated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: payrunStatus === 'Validated' ? 1 : payrunStatus === 'Paid' ? 0.7 : 0.5 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: payrunStatus === 'Validated' ? '#059669' : payrunStatus === 'Paid' ? '#059669' : '#E2E8F0',
            color: payrunStatus === 'Draft' || payrunStatus === 'Computed' ? '#64748B' : '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {payrunStatus === 'Paid' ? '✓' : '3'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>3. Validated</strong>
            <span className="text-xs text-muted">Locked & verified</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        {/* State 4: Paid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: payrunStatus === 'Paid' ? 1 : 0.5 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: payrunStatus === 'Paid' ? '#172554' : '#E2E8F0',
            color: payrunStatus === 'Paid' ? '#FFFFFF' : '#64748B',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            4
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>4. Paid</strong>
            <span className="text-xs text-muted">Direct deposit sent</span>
          </div>
        </div>
      </div>

      {/* METRICS & WORKFLOW ACTION BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        backgroundColor: '#172554',
        color: '#FFFFFF',
        borderRadius: '14px',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#FFFFFF' }}>
              {payrunData?.config?.payrunTitle || 'September 2026 Monthly Payrun'}
            </h2>
            <Badge variant={payrunStatus === 'Paid' ? 'primary' : payrunStatus === 'Validated' ? 'success' : payrunStatus === 'Computed' ? 'accent' : 'warning'}>
              {payrunStatus}
            </Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
            Period: {payrunData?.config?.startDate || '2026-09-01'} to {payrunData?.config?.endDate || '2026-09-30'} • Target Scope: {payrunData?.config?.department || 'All Departments'}
          </p>
        </div>

        {/* PRIMARY WORKFLOW ACTIONS: COMPUTE -> VALIDATE -> MARK PAID -> SEND PAYSLIPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {payrunStatus === 'Draft' && (
            <Button
              variant="accent"
              icon={Play}
              loading={loadingAction === 'compute'}
              onClick={handleCompute}
            >
              Compute Salary Rules
            </Button>
          )}

          {payrunStatus === 'Computed' && (
            <Button
              variant="accent"
              icon={ShieldCheck}
              loading={loadingAction === 'validate'}
              onClick={() => setShowValidateModal(true)}
            >
              Validate Payrun
            </Button>
          )}

          {payrunStatus === 'Validated' && (
            <Button
              variant="primary"
              icon={DollarSign}
              loading={loadingAction === 'paid'}
              onClick={() => setShowPaidModal(true)}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              Mark Paid & Disburse
            </Button>
          )}

          {(payrunStatus === 'Validated' || payrunStatus === 'Paid') && (
            <Button
              variant="secondary"
              icon={Mail}
              loading={loadingAction === 'send'}
              onClick={handleSendPayslips}
            >
              Send PDF Payslips
            </Button>
          )}
        </div>
      </div>

      {/* SUMMARY TOTALS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card>
          <span className="text-sm text-secondary font-medium">Target Headcount</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '8px' }}>{payslips.length} Employees</div>
        </Card>
        <Card>
          <span className="text-sm text-secondary font-medium">Total Gross Payroll</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
            ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card>
          <span className="text-sm text-secondary font-medium">Total Statutory Deductions</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#E11D48', marginTop: '8px' }}>
            -${Math.abs(totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card>
          <span className="text-sm text-secondary font-medium">Total Net Transfer</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', marginTop: '8px' }}>
            ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      {/* PAYSLIP TABLE WITH BACKEND WARNING LINKS */}
      <Card title="Generated Payslips & Anomaly Warnings" subtitle="Individual employee payslip evaluation statements">
        <Table headers={['Employee', 'Worked Days', 'Gross Wage', 'Deductions', 'Net Salary', 'Backend Warnings', 'Status', 'Actions']}>
          {payslips.map((p) => (
            <tr key={p.id}>
              <td>
                <strong style={{ color: '#0F172A' }}>{p.employeeName}</strong>
                <div className="text-xs text-muted">ID: {p.employeeId}</div>
              </td>
              <td><span className="text-sm font-medium">{p.workedDays}</span></td>
              <td><span className="font-semibold text-sm">${p.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
              <td><span className="text-sm text-error">-${Math.abs(p.deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
              <td><strong className="text-success" style={{ fontSize: '0.95rem' }}>${p.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
              <td>
                {/* Backend Provided Warnings Linking to Relevant Route */}
                {p.warning ? (
                  <span 
                    onClick={() => navigate(p.warning.link)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#E11D48',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                    title="Click to resolve issue"
                  >
                    <AlertTriangle size={14} /> {p.warning.message}
                  </span>
                ) : (
                  <span className="text-xs text-muted">Clean</span>
                )}
              </td>
              <td>
                <Badge variant={p.status === 'Paid' ? 'primary' : p.status === 'Validated' ? 'success' : p.status === 'Computed' ? 'accent' : 'warning'}>
                  {p.status}
                </Badge>
              </td>
              <td>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Eye}
                  onClick={() => { setSelectedPayslip(p); setIsDetailModalOpen(true); }}
                >
                  Statement
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* PAYSLIP DETAIL MODAL */}
      <PayslipDetail
        payslip={selectedPayslip}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* CONFIRMATION DIALOG FOR PAYRUN VALIDATION */}
      <ConfirmModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onConfirm={confirmValidate}
        title="Validate Payrun"
        message="Are you sure you want to validate and lock this payrun? Once validated, salary line computations will be locked for auditing."
        confirmText="Validate & Lock"
        variant="accent"
      />

      {/* CONFIRMATION DIALOG FOR PAYMENT DISBURSEMENT */}
      <ConfirmModal
        isOpen={showPaidModal}
        onClose={() => setShowPaidModal(false)}
        onConfirm={confirmMarkPaid}
        title="Mark Paid & Disburse Payroll"
        message="Are you sure you want to authorize direct deposit disbursemets for all employees in this payrun?"
        confirmText="Authorize & Pay"
        variant="primary"
      />
    </div>
  );
};

export default PayrunProcessing;
