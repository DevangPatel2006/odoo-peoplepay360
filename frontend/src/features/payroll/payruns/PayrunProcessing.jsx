import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Modal, Spinner } from '../../../components/ui';
import { PayslipDetail } from '../payslips/PayslipDetail';
import { 
  Play, 
  CheckCircle2, 
  DollarSign, 
  Mail, 
  AlertTriangle, 
  Eye, 
  FileText, 
  RefreshCw,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';
import axiosClient from '../../../api/axiosClient';

export const PayrunProcessing = ({ payrun, onDone }) => {
  const { addToast } = useApp();
  const payrunId = payrun?.id;

  const [loading, setLoading] = useState(true);
  const [payrunDetails, setPayrunDetails] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingPayslipId, setLoadingPayslipId] = useState(null);

  // Confirmation modal states
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);

  const loadPayrunDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axiosClient.get(`/payruns/${id}`);
      setPayrunDetails(response.data);
    } catch (err) {
      console.error('Failed to load payrun details:', err);
      addToast(err.response?.data?.error?.message || 'Failed to load payrun details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payrunId) {
      loadPayrunDetails(payrunId);
    }
  }, [payrunId]);

  const currentStatus = payrunDetails?.status || payrun?.status || 'Draft';
  const payslips = payrunDetails?.payslips || [];
  const warnings = payrunDetails?.warnings || [];

  const totalGross = payslips.reduce((sum, p) => sum + parseFloat(p.gross_amount || 0), 0);
  const totalNet = payslips.reduce((sum, p) => sum + parseFloat(p.net_amount || 0), 0);
  const totalDeductions = totalGross - totalNet;

  // Actions
  const handleCompute = async () => {
    setLoadingAction('compute');
    try {
      await axiosClient.post(`/payruns/${payrunId}/compute`);
      addToast('Payrun formulas and salary rules computed successfully!', 'success');
      await loadPayrunDetails(payrunId);
    } catch (err) {
      console.error('Failed to compute payrun:', err);
      addToast(err.response?.data?.error?.message || 'Failed to compute payrun formulas', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const confirmValidate = async () => {
    setShowValidateModal(false);
    setLoadingAction('validate');
    try {
      await axiosClient.post(`/payruns/${payrunId}/validate`, { acknowledge_warnings: true });
      addToast('Payrun validated and locked for disbursement.', 'success');
      await loadPayrunDetails(payrunId);
    } catch (err) {
      console.error('Failed to validate payrun:', err);
      addToast(err.response?.data?.error?.message || 'Failed to validate payrun', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const confirmMarkPaid = async () => {
    setShowPaidModal(false);
    setLoadingAction('paid');
    try {
      await axiosClient.post(`/payruns/${payrunId}/mark-paid`);
      addToast('Payrun marked as Paid. Direct deposit disbursement recorded.', 'success');
      await loadPayrunDetails(payrunId);
    } catch (err) {
      console.error('Failed to mark payrun paid:', err);
      addToast(err.response?.data?.error?.message || 'Failed to record disbursement', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendPayslips = async () => {
    setLoadingAction('send');
    try {
      const response = await axiosClient.post(`/payruns/${payrunId}/send-payslips`);
      addToast(`Bulk payslip email notifications dispatched! (${response.data?.sent_count ?? payslips.length} sent)`, 'success');
    } catch (err) {
      console.error('Failed to send payslips:', err);
      addToast(err.response?.data?.error?.message || 'Failed to dispatch payslip emails', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportSummaryPdf = async () => {
    setLoadingAction('export-pdf');
    try {
      const response = await axiosClient.get(`/payruns/${payrunId}/summary-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payrun_${payrunId}_Disbursement_Summary.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast(`Downloaded Payrun Summary PDF statement!`, 'success');
    } catch (err) {
      console.error('Failed to download payrun summary PDF:', err);
      addToast('Failed to export payrun summary PDF.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewPayslipDetails = async (slip) => {
    setLoadingPayslipId(slip.id);
    try {
      const response = await axiosClient.get(`/payslips/${slip.id}`);
      setSelectedPayslip(response.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load payslip lines:', err);
      setSelectedPayslip(slip);
      setIsDetailModalOpen(true);
    } finally {
      setLoadingPayslipId(null);
    }
  };

  if (!payrunId) {
    return (
      <Card>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <p>No payrun selected.</p>
          <Button variant="outline" onClick={onDone} style={{ marginTop: '12px' }}>
            Back to Payrun Directory
          </Button>
        </div>
      </Card>
    );
  }

  const periodStr = payrunDetails?.period_start 
    ? `${String(payrunDetails.period_start).slice(0, 10)} to ${String(payrunDetails.period_end).slice(0, 10)}` 
    : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* STATE PROGRESSION HEADER */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: currentStatus === 'Draft' ? 1 : 0.8 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentStatus === 'Draft' ? '#D97706' : '#059669',
            color: '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {currentStatus !== 'Draft' ? '✓' : '1'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>1. Draft Scope</strong>
            <span className="text-xs text-muted">Created & targeted</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: currentStatus === 'Computed' ? 1 : currentStatus === 'Validated' || currentStatus === 'Paid' ? 0.8 : 0.4 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentStatus === 'Computed' ? '#059669' : currentStatus === 'Validated' || currentStatus === 'Paid' ? '#059669' : '#E2E8F0',
            color: currentStatus === 'Draft' ? '#64748B' : '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {currentStatus === 'Validated' || currentStatus === 'Paid' ? '✓' : '2'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>2. Computed</strong>
            <span className="text-xs text-muted">Rules & formulas</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: currentStatus === 'Validated' ? 1 : currentStatus === 'Paid' ? 0.8 : 0.4 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentStatus === 'Validated' ? '#059669' : currentStatus === 'Paid' ? '#059669' : '#E2E8F0',
            color: ['Draft', 'Computed'].includes(currentStatus) ? '#64748B' : '#FFFFFF',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem'
          }}>
            {currentStatus === 'Paid' ? '✓' : '3'}
          </div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>3. Validated</strong>
            <span className="text-xs text-muted">Locked & verified</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: currentStatus === 'Paid' ? 1 : 0.4 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentStatus === 'Paid' ? '#059669' : '#E2E8F0',
            color: currentStatus === 'Paid' ? '#FFFFFF' : '#64748B',
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
            <span className="text-xs text-muted">Disbursed & locked</span>
          </div>
        </div>
      </div>

      {/* METRICS & WORKFLOW ACTION BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 700 }}>
              {payrunDetails?.name || payrun?.name}
            </h2>
            <Badge 
              variant={currentStatus === 'Paid' ? 'primary' : currentStatus === 'Validated' ? 'success' : currentStatus === 'Computed' ? 'accent' : 'warning'}
              style={{ fontSize: '0.85rem' }}
            >
              {currentStatus}
            </Badge>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px' }}>
            Pay Period: {periodStr} • Structure: {payrunDetails?.salary_structure_name || 'Standard'}
          </p>
        </div>

        {/* WORKFLOW ACTION BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            variant="outline" 
            size="sm" 
            icon={RefreshCw}
            loading={loading}
            onClick={() => loadPayrunDetails(payrunId)}
            style={{ color: '#FFFFFF', borderColor: '#334155' }}
          >
            Refresh
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            icon={Download}
            loading={loadingAction === 'export-pdf'}
            onClick={handleExportSummaryPdf}
            style={{ color: '#FFFFFF', borderColor: '#334155' }}
          >
            Export Summary (PDF)
          </Button>

          {currentStatus === 'Draft' && (
            <Button 
              variant="accent" 
              icon={Play}
              loading={loadingAction === 'compute'}
              onClick={handleCompute}
            >
              Compute Formulas
            </Button>
          )}

          {currentStatus === 'Computed' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                icon={RefreshCw}
                loading={loadingAction === 'compute'}
                onClick={handleCompute}
                style={{ color: '#FFFFFF', borderColor: '#334155' }}
              >
                Recompute
              </Button>
              <Button 
                variant="success" 
                icon={CheckCircle2}
                onClick={() => setShowValidateModal(true)}
              >
                Validate Payrun
              </Button>
            </>
          )}

          {currentStatus === 'Validated' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                icon={Mail}
                loading={loadingAction === 'send'}
                onClick={handleSendPayslips}
                style={{ color: '#FFFFFF', borderColor: '#334155' }}
              >
                Send Payslip Emails
              </Button>
              <Button 
                variant="primary" 
                icon={DollarSign}
                onClick={() => setShowPaidModal(true)}
              >
                Mark Paid / Confirm Disbursement
              </Button>
            </>
          )}

          {currentStatus === 'Paid' && (
            <Button 
              variant="outline" 
              icon={Mail}
              loading={loadingAction === 'send'}
              onClick={handleSendPayslips}
              style={{ color: '#FFFFFF', borderColor: '#334155' }}
            >
              Send Payslip Emails
            </Button>
          )}
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card>
          <span className="text-xs text-secondary font-medium">Target Payslips</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
            {payslips.length}
          </div>
        </Card>

        <Card>
          <span className="text-xs text-secondary font-medium">Total Gross Payroll</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
            ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <span className="text-xs text-secondary font-medium">Total Deductions</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#E11D48', marginTop: '4px' }}>
            -${Math.abs(totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <span className="text-xs text-secondary font-medium">Total Net Disbursement</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
            ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

     
      {/* PAYSLIPS TABLE */}
      <Card 
        title="Evaluated Employee Payslips" 
        subtitle={currentStatus === 'Draft' ? 'Employee payslips are in Draft state. Click "Compute Formulas" above to evaluate salary rules.' : 'Calculated payroll lines breakdown'}
      >
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner size="md" />
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading payslip records...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No payslips linked to this payrun batch.</p>
          </div>
        ) : (
          <Table headers={['Employee', 'Department', 'Worked Days', 'Gross', 'Net', 'Status', 'Actions']}>
            {payslips.map((slip) => {
              const name = `${slip.first_name || ''} ${slip.last_name || ''}`.trim() || slip.employee_name || 'Employee';
              const code = slip.employee_code || (slip.employee_id ? `EMP-${slip.employee_id}` : '');
              const gross = parseFloat(slip.gross_amount || 0);
              const net = parseFloat(slip.net_amount || 0);

              return (
                <tr key={slip.id}>
                  <td>
                    <strong style={{ color: '#0F172A' }}>{name}</strong>
                    <div className="text-xs text-muted">ID: {code} • Slip #{slip.id}</div>
                  </td>
                  <td>{slip.department_name || 'General'}</td>
                  <td><span className="font-medium text-sm">{slip.worked_days ?? 0} days</span></td>
                  <td><strong className="text-sm">${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                  <td><strong className="text-success text-sm">${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                  <td>
                    <Badge variant={slip.status === 'Paid' ? 'primary' : slip.status === 'Done' ? 'success' : 'warning'} dot>
                      {slip.status || 'Draft'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Eye}
                      loading={loadingPayslipId === slip.id}
                      onClick={() => handleViewPayslipDetails(slip)}
                    >
                      View Breakdown
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* VALIDATION CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onConfirm={confirmValidate}
        title="Validate & Lock Payrun"
        message={
          warnings.length > 0
            ? `Attention: This payrun has ${warnings.length} warning(s). By validating, you acknowledge these warnings and lock the payrun numbers for payment.`
            : 'Are you sure you want to validate this payrun? This will lock all computed gross and net figures for bank disbursement.'
        }
        confirmText="Confirm & Validate"
        variant="warning"
      />

      {/* MARK PAID CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showPaidModal}
        onClose={() => setShowPaidModal(false)}
        onConfirm={confirmMarkPaid}
        title="Confirm Payment Disbursement"
        message="Marking this payrun as Paid will record the direct deposit bank transfers and permanently lock the payroll period. Proceed?"
        confirmText="Confirm Paid"
        variant="primary"
      />

      {/* DETAILED PAYSLIP MODAL */}
      <PayslipDetail
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        payslip={selectedPayslip}
      />
    </div>
  );
};

export default PayrunProcessing;
