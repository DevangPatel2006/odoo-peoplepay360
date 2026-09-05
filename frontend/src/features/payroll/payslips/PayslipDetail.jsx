import React from 'react';
import { Modal, Badge, Button, Table } from '../../../components/ui';
import { Download, Mail, ExternalLink, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store';
import axiosClient from '../../../api/axiosClient';

export const PayslipDetail = ({ payslip, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  if (!payslip) return null;

  const empName = payslip.employeeName || (payslip.employee_first_name ? `${payslip.employee_first_name} ${payslip.employee_last_name}`.trim() : (payslip.first_name ? `${payslip.first_name} ${payslip.last_name}`.trim() : 'Employee'));
  const empCode = payslip.employeeId || payslip.employee_code || (payslip.employee_id ? `EMP-${payslip.employee_id}` : 'N/A');
  const payrunTitle = payslip.payrunTitle || payslip.payrun_name || 'Payrun';
  const periodStr = payslip.payPeriod || (payslip.period_start ? `${String(payslip.period_start).slice(0, 10)} to ${String(payslip.period_end).slice(0, 10)}` : 'N/A');
  const structureName = payslip.salaryStructure || payslip.salary_structure_name || 'Salary Structure';
  const bankAccount = payslip.bank_account_number || payslip.bankAccount || 'Not Specified';
  const workedDays = payslip.worked_days !== undefined ? `${payslip.worked_days} days` : (payslip.workedDays || '0 days');

  const grossAmount = parseFloat(payslip.gross_amount ?? payslip.gross ?? 0);
  const netAmount = parseFloat(payslip.net_amount ?? payslip.net ?? 0);
  const basicAmount = parseFloat(payslip.basic_amount ?? payslip.basic ?? 0);
  const totalDeductions = grossAmount - netAmount;

  const lines = Array.isArray(payslip.lines) ? payslip.lines : [];

  const earningsLines = lines.filter((l) => ['Basic', 'Allowance', 'Earnings'].includes(l.category));
  const grossLines = lines.filter((l) => l.category === 'Gross');
  const deductionLines = lines.filter((l) => ['Deduction', 'Deductions'].includes(l.category));
  const netLines = lines.filter((l) => ['Net', 'Net Pay'].includes(l.category));

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await axiosClient.get(`/payslips/${payslip.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip-${empCode}-${payslip.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      window.print();
    }
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
      title={`Official Payslip Document: ${empName}`}
      footer={
        <>
          <Button variant="outline" icon={ExternalLink} onClick={handleViewPayrun}>
            View Payrun
          </Button>
          <Button variant="outline" icon={Download} onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button variant="accent" icon={Mail} onClick={() => addToast(`Payslip PDF statement queued for ${empName}!`, 'success')}>
            Send Payslip Email
          </Button>
        </>
      }
    >
      <div style={{
        padding: '28px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-family-base)'
      }}>
        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
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
              variant={payslip.status === 'Paid' ? 'primary' : payslip.status === 'Done' ? 'success' : 'warning'}
              style={{ fontSize: '0.875rem', padding: '6px 12px' }}
            >
              {payslip.status || 'Draft'}
            </Badge>
            <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
              Statement ID: <strong>{payslip.id ? `PSL-${payslip.id}` : 'Draft'}</strong>
            </div>
          </div>
        </div>

        {/* METADATA GRID */}
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
            <div className="font-bold" style={{ color: '#0F172A' }}>{empName}</div>
            <div className="text-xs text-secondary">Employee ID: {empCode}</div>
          </div>

          <div>
            <span className="text-xs text-muted">Pay Period & Payrun:</span>
            <div className="font-semibold">{payrunTitle}</div>
            <div className="text-xs text-secondary">{periodStr}</div>
          </div>

          <div>
            <span className="text-xs text-muted">Salary Structure:</span>
            <div className="font-semibold" style={{ color: '#7C3AED' }}>
              {structureName}
            </div>
            <div className="text-xs text-secondary">Bank Account: {bankAccount}</div>
          </div>

          <div>
            <span className="text-xs text-muted">Attendance Inputs:</span>
            <div className="font-bold" style={{ color: '#0F172A' }}>{workedDays} Worked</div>
            <div className="text-xs text-secondary">Department: {payslip.department_name || payslip.department || 'General'}</div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span className="text-xs text-muted font-medium">Gross Salary</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
              ${grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ padding: '14px', background: '#FFF1F2', borderRadius: '10px', border: '1px solid #FECDD3' }}>
            <span className="text-xs text-error font-medium">Total Deductions</span>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#E11D48', marginTop: '4px' }}>
              -${Math.abs(totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

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
              ${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* BREAKDOWN */}
        <h4 style={{ marginBottom: '12px', color: '#0F172A' }}>Salary Rule Lines Breakdown</h4>

        {lines.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.875rem' }}>
            <FileText size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No rule lines computed yet for this draft payslip. Run "Compute Formulas" on the payrun to generate salary breakdown.</p>
          </div>
        ) : (
          <>
            {earningsLines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div className="text-xs font-bold text-success" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  + Earnings & Allowances
                </div>
                <Table headers={['Rule Code', 'Rule Name', 'Category', 'Amount ($)']}>
                  {earningsLines.map((line, idx) => (
                    <tr key={idx}>
                      <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                      <td><strong style={{ color: '#0F172A' }}>{line.rule_name || line.name}</strong></td>
                      <td><Badge variant="success">{line.category}</Badge></td>
                      <td><strong className="text-success">${parseFloat(line.computed_amount ?? line.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}

            {grossLines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Table headers={['Rule Code', 'Rule Name', 'Category', 'Gross Total ($)']}>
                  {grossLines.map((line, idx) => (
                    <tr key={idx} style={{ backgroundColor: '#F8FAFC', fontWeight: 600 }}>
                      <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                      <td><strong style={{ color: '#0F172A' }}>{line.rule_name || line.name}</strong></td>
                      <td><Badge variant="accent">Gross</Badge></td>
                      <td><strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>${parseFloat(line.computed_amount ?? line.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}

            {deductionLines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div className="text-xs font-bold text-error" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  - Statutory Deductions
                </div>
                <Table headers={['Rule Code', 'Rule Name', 'Category', 'Amount ($)']}>
                  {deductionLines.map((line, idx) => (
                    <tr key={idx}>
                      <td><span className="font-mono text-xs font-semibold" style={{ color: '#7C3AED' }}>{line.code}</span></td>
                      <td><strong style={{ color: '#0F172A' }}>{line.rule_name || line.name}</strong></td>
                      <td><Badge variant="error">{line.category}</Badge></td>
                      <td><strong className="text-error">-${Math.abs(parseFloat(line.computed_amount ?? line.amount ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}

            <div style={{
              padding: '16px 20px',
              backgroundColor: '#EFF6FF',
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span className="text-xs font-bold text-primary" style={{ textTransform: 'uppercase' }}>Net Disbursement Calculation</span>
                <div className="text-xs text-secondary">
                  Gross (${grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) - Deductions (${Math.abs(totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Net Payable Amount</span>
                <strong style={{ fontSize: '1.5rem', color: '#172554' }}>
                  ${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PayslipDetail;
