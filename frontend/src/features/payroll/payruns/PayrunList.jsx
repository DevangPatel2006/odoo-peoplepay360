import React, { useState } from 'react';
import { Card, Table, Badge, Button } from '../../../components/ui';
import { Plus, Play, Eye, FileText, Calendar, CheckCircle2 } from 'lucide-react';

export const PayrunList = ({ onStartWizard }) => {
  const [payruns, setPayruns] = useState([
    {
      id: 'PAYRUN-2026-09',
      title: 'September 2026 Monthly Payrun',
      period: '2026-09-01 to 2026-09-30',
      employeesCount: 4,
      totalGross: '$42,240.00',
      totalNet: '$37,171.20',
      status: 'Validated', // Validated | Computed | Draft | Paid
      paymentDate: '2026-09-30',
    },
    {
      id: 'PAYRUN-2026-08',
      title: 'August 2026 Monthly Payrun',
      period: '2026-08-01 to 2026-08-31',
      employeesCount: 138,
      totalGross: '$485,200.00',
      totalNet: '$426,976.00',
      status: 'Paid',
      paymentDate: '2026-08-31',
    },
    {
      id: 'PAYRUN-2026-07',
      title: 'July 2026 Monthly Payrun',
      period: '2026-07-01 to 2026-07-31',
      employeesCount: 135,
      totalGross: '$472,100.00',
      totalNet: '$415,448.00',
      status: 'Paid',
      paymentDate: '2026-07-31',
    },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Payrun Execution Directory</h3>
          <p className="text-sm text-secondary">Historical payruns, payslip evaluation batches, and payment states.</p>
        </div>
        <Button variant="accent" icon={Plus} onClick={onStartWizard}>
          Launch 2-Step Payrun Wizard
        </Button>
      </div>

      <Table headers={['Payrun Title', 'Period', 'Employees', 'Gross Payroll', 'Net Payroll', 'Payment Date', 'Status', 'Actions']}>
        {payruns.map((pr) => (
          <tr key={pr.id}>
            <td>
              <strong style={{ color: '#0F172A' }}>{pr.title}</strong>
              <div className="text-xs text-muted">Ref: {pr.id}</div>
            </td>
            <td><span className="text-sm">{pr.period}</span></td>
            <td><span className="font-semibold text-sm">{pr.employeesCount}</span></td>
            <td><span className="font-medium text-sm">{pr.totalGross}</span></td>
            <td><strong className="text-success">{pr.totalNet}</strong></td>
            <td><span className="text-xs text-secondary">{pr.paymentDate}</span></td>
            <td>
              <Badge variant={pr.status === 'Paid' ? 'success' : pr.status === 'Validated' ? 'accent' : 'warning'} dot>
                {pr.status}
              </Badge>
            </td>
            <td>
              <Button variant="ghost" size="sm" icon={Eye}>
                View Payslips
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
};
