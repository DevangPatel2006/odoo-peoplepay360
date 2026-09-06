import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Input, Select, Pagination, EmptyState, Spinner, Alert } from '../../../components/ui';
import { PayslipDetail } from './PayslipDetail';
import { Eye, Search, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { useApp } from '../../../store';

export const PayslipList = () => {
  const { addToast } = useApp();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [downloadingSlipId, setDownloadingSlipId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const mapPayslip = (p) => ({
    ...p,
    id: p.id,
    displayId: p.payslip_number || `PSL-${p.id}`,
    employeeName: `${p.employee_first_name || p.first_name || ''} ${p.employee_last_name || p.last_name || ''}`.trim() || 'Employee',
    employeeId: p.employee_code || (p.employee_id ? `EMP-${p.employee_id}` : 'N/A'),
    department: p.department_name || p.department || 'General',
    payPeriod: (p.period_start && p.period_end ? `${String(p.period_start).slice(0, 10)} to ${String(p.period_end).slice(0, 10)}` : 'Period'),
    payrunTitle: p.payrun_name || p.payrunTitle || `Payrun #${p.payrun_id || ''}`,
    gross: parseFloat(p.gross_amount || 0),
    deductions: parseFloat(p.gross_amount || 0) - parseFloat(p.net_amount || 0),
    net: parseFloat(p.net_amount || 0),
    status: p.status || 'Draft',
    salaryStructure: p.salary_structure_name || p.salaryStructure || 'Standard Structure',
    bankAccount: p.bank_account_number || 'Not Specified',
    workedDays: p.worked_days !== undefined ? `${p.worked_days} days` : '0 days',
  });

  const fetchPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/payslips');
      const list = Array.isArray(response.data) ? response.data : [];
      setPayslips(list.map(mapPayslip));
    } catch (err) {
      console.error('Failed to load payslips:', err);
      setError(err.response?.data?.error?.message || 'Failed to load employee payslips.');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleOpenDetail = async (p) => {
    setLoadingDetailId(p.id);
    try {
      const response = await axiosClient.get(`/payslips/${p.id}`);
      setSelectedPayslip(response.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load full payslip details:', err);
      setSelectedPayslip(p);
      setIsDetailModalOpen(true);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleDirectDownload = async (p) => {
    setDownloadingSlipId(p.id);
    try {
      const res = await axiosClient.get(`/payslips/${p.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip-${p.employeeId}-${p.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast(`Downloaded official PDF for ${p.employeeName}`, 'success');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      addToast('Failed to generate payslip PDF download.', 'error');
    } finally {
      setDownloadingSlipId(null);
    }
  };

  const filteredPayslips = payslips.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.employeeName.toLowerCase().includes(query) ||
      p.payrunTitle.toLowerCase().includes(query) ||
      String(p.id).includes(query) ||
      String(p.employeeId).toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayslips.length / itemsPerPage) || 1;
  const paginatedPayslips = filteredPayslips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Employee Payslip Statements</h3>
          <p className="text-sm text-secondary">Official payroll statements, statutory tax lines, and net disbursements.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchPayslips} loading={loading}>
            Refresh
          </Button>
          <Button variant="outline" icon={ArrowRight} onClick={() => navigate('/payroll')}>
            View Payrun Wizard
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* FILTER BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search employee, payrun, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Done">Done</option>
          <option value="Draft">Draft</option>
        </Select>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : paginatedPayslips.length === 0 ? (
        <EmptyState 
          title="No Payslips Found" 
          description={searchQuery ? "No payslip statements match your search criteria." : "No payslips generated yet. Create and compute a payrun to generate employee statements."} 
        />
      ) : (
        <Table headers={['Employee', 'Pay Period & Payrun', 'Salary Structure', 'Worked Days', 'Gross Salary', 'Deductions', 'Net Salary', 'Status', 'Actions']}>
          {paginatedPayslips.map((p) => (
            <tr key={p.id}>
              <td>
                <strong style={{ color: '#0F172A' }}>{p.employeeName}</strong>
                <div className="text-xs text-muted">ID: {p.employeeId}</div>
              </td>
              <td>
                <span className="text-sm font-semibold" style={{ display: 'block' }}>{p.payrunTitle}</span>
                <span className="text-xs text-secondary">{p.payPeriod}</span>
              </td>
              <td><span className="text-xs text-secondary">{p.salaryStructure}</span></td>
              <td><span className="text-sm font-medium">{p.workedDays}</span></td>
              <td><span className="font-medium text-sm">${p.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
              <td><span className="text-sm text-error">-${Math.abs(p.deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
              <td><strong className="text-success" style={{ fontSize: '0.95rem' }}>${p.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
              <td>
                <Badge variant={p.status === 'Paid' ? 'primary' : p.status === 'Done' ? 'success' : 'warning'}>
                  {p.status}
                </Badge>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Eye}
                    loading={loadingDetailId === p.id}
                    onClick={() => handleOpenDetail(p)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Download}
                    loading={downloadingSlipId === p.id}
                    onClick={() => handleDirectDownload(p)}
                    title="Direct PDF Download"
                  >
                    PDF
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* PAGINATION */}
      {filteredPayslips.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={filteredPayslips.length}
        />
      )}

      {/* PAYSLIP DETAIL OFFICIAL DOCUMENT MODAL */}
      <PayslipDetail
        payslip={selectedPayslip}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

export default PayslipList;
