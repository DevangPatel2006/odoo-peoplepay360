import React from 'react';
import { Modal, Badge, Button, Table, Card } from '../../../components/ui';
import { Download, Mail, FileText, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../../store';

export const PayslipDetail = ({ payslip, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  if (!payslip) return null;

  // Grouped salary rule lines returned by backend API contract
  const lines = payslip.lines || [
    { code: 'BASIC', name: 'Basic Salary', category: 'Earnings', formula: '100% of Base Contract Wage', amount: 8500.00 },
    { code: 'HRA', name: 'House Rent Allowance', category: 'Earnings', formula: '40% of BASIC', amount: 3400.00 },
    { code: 'CONV', name: 'Conveyance Allowance', category: 'Earnings', formula: 'Fixed $200.00 Monthly', amount: 200.00 },
    { code: 'GROSS', name: 'Gross Salary Computation', category: 'Gross', formula: 'BASIC + HRA + CONV', amount: 12100.00 },
    { code: 'TAX', name: 'Statutory Income Tax Withholding', category: 'Deductions', formula: '12% of GROSS', amount: -1452.00 },
    { code: 'NET', name: 'Net Salary Payable', category: 'Net', formula: 'GROSS - TAX', amount: 10648.00 },
  ];

  const earningsLines = lines.filter((l) => l.category === 'Earnings');
  const grossLines = lines.filter((l) => l.category === 'Gross');
  const deductionLines = lines.filter((l) => l.category === 'Deductions');
  const netLines = lines.filter((l) => l.category === 'Net' || l.category === 'Net Pay');

  const handlePrintPDF = () => {
    window.print();
  };

  const handleViewPayrun = () => {
    onClose();
    navigate('/payroll');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Official Payslip Document: ${payslip.employeeName}`}
      footer={
        <>
          <Button variant="outline" icon={ExternalLink} onClick={handleViewPayrun}>
            View Payrun
          </Button>
          <Button variant="outline" icon={Download} onClick={handlePrintPDF}>
            Generate / View PDF
          </Button>
          <Button variant="accent" icon={Mail} onClick={() => addToast(`Payslip PDF statement emailed to ${payslip.employeeName}!`, 'success')}>
            Send Payslip Email
          </Button>
        </>
      }
    >
      {/* OFFICIAL PAYROLL DOCUMENT CONTAINER */}
      <div style={{
        padding: '28px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-family-base)'
      }}>
        
        {/* 1. HEADER SECTION */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '20px',
          borderBottom: '3px solid #172554',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #172554 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                P
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#172554' }}>PeoplePay360</h2>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Official Employee Payslip Statement
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Badge 
              variant={payslip.status === 'Paid' ? 'primary' : payslip.status === 'Validated' ? 'success' : 'warning'}
              style={{ fontSize: '0.875rem', padding: '6px 12px' }}
            >
              {payslip.status || 'Validated'}
            </Badge>
            <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
              Statement ID: <strong>{payslip.id || 'PSL-2026-09-01'}</strong>
            </div>
          </div>
        </div>

        {/* METADATA GRID: EMPLOYEE, STRUCTURE, PAYRUN */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
          fontSize: '0.875rem'
        }}>
          <div>
            <span className="text-xs text-muted">Employee:</span>
            <div className="font-bold" style={{ color: '#0F172A' }}>{payslip.employeeName}</div>
            <div className="text-xs text-secondary">Employee ID: {payslip.employeeId || 'EMP-101'}</div>
          </div>

          <div>
            <span className="text-xs text-muted">Pay Period & Payrun:</span>
            <div className="font-semibold">{payslip.payrunTitle || 'September 2026 Monthly Payrun'}</div>
            <div className="text-xs text-secondary">{payslip.payPeriod || '2026-09-01 to 2026-09-30'}</div>
          </div>

          <div>
            <span className="text-xs text-muted">Salary Structure:</span>
            <div className="font-semibold" style={{ color: '#7C3AED' }}>
              {payslip.salaryStructure || 'Standard Software Engineer Structure'}
            </div>
            <div className="text-xs text-secondary">Direct Deposit: {payslip.bankAccount || 'US89370001928374'}</div>
          </div>

          {/* WORKED DAYS / INPUTS DISPLAYED FROM BACKEND */}
          <div>
            <span className="text-xs text-muted">Worked Days & Attendance Inputs:</span>
            <div className="font-bold" style={{ color: '#0F172A' }}>{payslip.workedDays || '22 days'} Worked</div>
            <div className="text-xs text-success">Scheduled: 22 days • Absences: 0</div>
          </div>
        </div>

        {/* 2. PROMINENT SUMMARY CARDS (Gross, Deductions, Net) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span className="text-xs text-muted font-medium">Gross Salary</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
              ${payslip.gross ? payslip.gross.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '12,100.00'}
            </div>
          </div>

          <div style={{ padding: '14px', background: '#FFF1F2', borderRadius: '10px', border: '1px solid #FECDD3' }}>
            <span className="text-xs text-error font-medium">Total Deductions</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#E11D48', marginTop: '4px' }}>
              -${payslip.deductions ? Math.abs(payslip.deductions).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '1,452.00'}
            </div>
          </div>

          {/* VISUALLY PROMINENT NET SALARY */}
          <div style={{ 
            padding: '16px', 
            background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 100%)', 
            color: '#FFFFFF', 
            borderRadius: '12px', 
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Net Payable Amount
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FFFFFF', marginTop: '2px', lineHeight: 1.1 }}>
              ${payslip.net ? payslip.net.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10,648.00'}
            </div>
          </div>
        </div>

        {/* 3. GROUPED SALARY BREAKDOWN TABLE (Earnings, Gross, Deductions, Net) */}
        <h4 style={{ marginBottom: '12px', color: '#0F172A' }}>Salary Rule Lines Breakdown</h4>
        
        {/* EARNINGS GROUP */}
        <div style={{ marginBottom: '16px' }}>
          <div className="text-xs font-bold text-success" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            + Earnings & Allowances
          </div>
          <Table headers={['Rule Code', 'Rule Name', 'Category', 'Computation Formula / Base', 'Amount ($)']}>
            {earningsLines.map((line, idx) => (
              <tr key={idx}>
                <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                <td><strong style={{ color: '#0F172A' }}>{line.name}</strong></td>
                <td><Badge variant="success">Earnings</Badge></td>
                <td><span className="text-xs font-mono text-secondary">{line.formula}</span></td>
                <td><strong className="text-success">${line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            ))}
          </Table>
        </div>

        {/* GROSS COMPUTATION LINE */}
        {grossLines.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Table headers={['Rule Code', 'Rule Name', 'Category', 'Computation Formula / Base', 'Gross Total ($)']}>
              {grossLines.map((line, idx) => (
                <tr key={idx} style={{ backgroundColor: '#F8FAFC', fontWeight: 600 }}>
                  <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                  <td><strong style={{ color: '#0F172A' }}>{line.name}</strong></td>
                  <td><Badge variant="accent">Gross</Badge></td>
                  <td><span className="text-xs font-mono text-secondary">{line.formula}</span></td>
                  <td><strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>${line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              ))}
            </Table>
          </div>
        )}

        {/* DEDUCTIONS GROUP */}
        <div style={{ marginBottom: '16px' }}>
          <div className="text-xs font-bold text-error" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            - Statutory Deductions
          </div>
          <Table headers={['Rule Code', 'Rule Name', 'Category', 'Computation Formula / Base', 'Amount ($)']}>
            {deductionLines.map((line, idx) => (
              <tr key={idx}>
                <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                <td><strong style={{ color: '#0F172A' }}>{line.name}</strong></td>
                <td><Badge variant="error">Deductions</Badge></td>
                <td><span className="text-xs font-mono text-secondary">{line.formula}</span></td>
                <td><strong className="text-error">-${Math.abs(line.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            ))}
          </Table>
        </div>

        {/* NET PAY FINAL SUMMARY */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#EFF6FF',
          borderRadius: '10px',
          border: '1px solid #BFDBFE',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span className="text-xs font-bold text-primary" style={{ textTransform: 'uppercase' }}>Net Disbursement Calculation</span>
            <div className="text-xs text-secondary">Gross Earnings ($12,100.00) - Deductions ($1,452.00)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="text-xs text-muted" style={{ display: 'block' }}>Net Payable Amount</span>
            <strong style={{ fontSize: '1.5rem', color: '#172554' }}>
              ${payslip.net ? payslip.net.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10,648.00'}
            </strong>
          </div>
        </div>

      </div>
    </Modal>
  );
};
