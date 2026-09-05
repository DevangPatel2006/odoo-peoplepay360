import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Input, Select, Modal, Pagination, EmptyState, Spinner } from '../../../components/ui';
import { PayslipDetail } from './PayslipDetail';
import { Eye, Download, Mail, Search, FileText, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';

export const PayslipList = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  const initialPayslips = [
    {
      id: 'PSL-2026-09-01',
      employeeName: 'Alexander Wright',
      employeeId: 'EMP-101',
      department: 'Software Engineering',
      position: 'Senior Lead Architect',
      payrunTitle: 'September 2026 Monthly Payrun',
      payPeriod: '2026-09-01 to 2026-09-30',
      salaryStructure: 'Standard Software Engineer Structure',
      workedDays: '22 days',
      bankAccount: 'US89370001928374',
      gross: 12100.00,
      deductions: -1452.00,
      net: 10648.00,
      status: 'Validated',
      lines: [
        { code: 'BASIC', name: 'Basic Salary', category: 'Earnings', amount: 8500.00 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'Earnings', amount: 3400.00 },
        { code: 'CONV', name: 'Conveyance Allowance', category: 'Earnings', amount: 200.00 },
        { code: 'GROSS', name: 'Gross Salary Computation', category: 'Gross', amount: 12100.00 },
        { code: 'TAX', name: 'Statutory Income Tax Withholding', category: 'Deductions', amount: -1452.00 },
        { code: 'NET', name: 'Net Salary Payable', category: 'Net Pay', amount: 10648.00 },
      ],
    },
    {
      id: 'PSL-2026-09-02',
      employeeName: 'Sophia Martinez',
      employeeId: 'EMP-102',
      department: 'Human Resources',
      position: 'HR Specialist',
      payrunTitle: 'September 2026 Monthly Payrun',
      payPeriod: '2026-09-01 to 2026-09-30',
      salaryStructure: 'HR & Administrative Structure',
      workedDays: '22 days',
      bankAccount: 'US89370001928888',
      gross: 8880.00,
      deductions: -1065.60,
      net: 7814.40,
      status: 'Validated',
      lines: [
        { code: 'BASIC', name: 'Basic Salary', category: 'Earnings', amount: 6200.00 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'Earnings', amount: 2480.00 },
        { code: 'CONV', name: 'Conveyance Allowance', category: 'Earnings', amount: 200.00 },
        { code: 'GROSS', name: 'Gross Salary Computation', category: 'Gross', amount: 8880.00 },
        { code: 'TAX', name: 'Statutory Income Tax Withholding', category: 'Deductions', amount: -1065.60 },
        { code: 'NET', name: 'Net Salary Payable', category: 'Net Pay', amount: 7814.40 },
      ],
    },
    {
      id: 'PSL-2026-09-03',
      employeeName: 'Marcus Vance',
      employeeId: 'EMP-103',
      department: 'Finance & Accounting',
      position: 'Payroll Accountant',
      payrunTitle: 'September 2026 Monthly Payrun',
      payPeriod: '2026-09-01 to 2026-09-30',
      salaryStructure: 'Finance & Accounting Structure',
      workedDays: '20 days',
      bankAccount: 'US89370001929999',
      gross: 10140.00,
      deductions: -1216.80,
      net: 8923.20,
      status: 'Validated',
      lines: [
        { code: 'BASIC', name: 'Basic Salary', category: 'Earnings', amount: 7100.00 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'Earnings', amount: 2840.00 },
        { code: 'CONV', name: 'Conveyance Allowance', category: 'Earnings', amount: 200.00 },
        { code: 'GROSS', name: 'Gross Salary Computation', category: 'Gross', amount: 10140.00 },
        { code: 'TAX', name: 'Statutory Income Tax Withholding', category: 'Deductions', amount: -1216.80 },
        { code: 'NET', name: 'Net Salary Payable', category: 'Net Pay', amount: 8923.20 },
      ],
    },
    {
      id: 'PSL-2026-08-01',
      employeeName: 'Alexander Wright',
      employeeId: 'EMP-101',
      department: 'Software Engineering',
      position: 'Senior Lead Architect',
      payrunTitle: 'August 2026 Monthly Payrun',
      payPeriod: '2026-08-01 to 2026-08-31',
      salaryStructure: 'Standard Software Engineer Structure',
      workedDays: '22 days',
      bankAccount: 'US89370001928374',
      gross: 12100.00,
      deductions: -1452.00,
      net: 10648.00,
      status: 'Paid',
      lines: [
        { code: 'BASIC', name: 'Basic Salary', category: 'Earnings', amount: 8500.00 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'Earnings', amount: 3400.00 },
        { code: 'CONV', name: 'Conveyance Allowance', category: 'Earnings', amount: 200.00 },
        { code: 'GROSS', name: 'Gross Salary Computation', category: 'Gross', amount: 12100.00 },
        { code: 'TAX', name: 'Statutory Income Tax Withholding', category: 'Deductions', amount: -1452.00 },
        { code: 'NET', name: 'Net Salary Payable', category: 'Net Pay', amount: 10648.00 },
      ],
    },
  ];

  const mapPayslip = (p) => ({
    ...p,
    id: p.payslip_number || `PSL-${p.id}`,
    dbId: p.id,
    employeeName: p.employeeName || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Employee',
    employeeId: p.employeeId || p.employee_code || `EMP-${p.employee_id}`,
    department: p.department || p.department_name || 'Engineering',
    payPeriod: p.payPeriod || (p.period_start && p.period_end ? `${String(p.period_start).split('T')[0]} to ${String(p.period_end).split('T')[0]}` : 'Current Period'),
    payrunTitle: p.payrunTitle || p.payrun_name || 'Regular Monthly Payrun',
    gross: p.gross !== undefined ? p.gross : parseFloat(p.gross_amount || 0),
    deductions: p.deductions !== undefined ? p.deductions : parseFloat(p.total_deductions || 0),
    net: p.net !== undefined ? p.net : parseFloat(p.net_amount || 0),
    status: p.status || 'Validated',
    salaryStructure: p.salaryStructure || p.salary_structure_name || 'Standard Structure',
    bankAccount: p.bankAccount || p.bank_account_number || 'US89370001928374',
    workedDays: p.workedDays || '22 days',
  });

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/payslips');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      if (list.length > 0) {
        setPayslips(list.map(mapPayslip));
      } else {
        setPayslips(initialPayslips);
      }
    } catch (err) {
      setPayslips(initialPayslips);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch =
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payrunTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

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
          <p className="text-sm text-secondary">View official payroll statements, PDF documents, and earnings breakdowns.</p>
        </div>
        <Button variant="outline" icon={ArrowRight} onClick={() => navigate('/payroll')}>
          View Active Payrun
        </Button>
      </div>

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
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search employee, payrun, statement ID..."
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
          <option value="Validated">Validated</option>
          <option value="Computed">Computed</option>
          <option value="Draft">Draft</option>
        </Select>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : paginatedPayslips.length === 0 ? (
        <EmptyState title="No Payslips Found" description="No payslip statements match your search criteria." />
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
                <Badge variant={p.status === 'Paid' ? 'primary' : p.status === 'Validated' ? 'success' : 'warning'}>
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
                  View Document
                </Button>
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
