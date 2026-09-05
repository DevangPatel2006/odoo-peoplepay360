import React, { useState } from 'react';
import { Table, Badge, Button, Modal, Select, Input } from '../../../components/ui';
import { RuleForm } from './RuleForm';
import { Plus, Edit, Trash2, Code, ArrowUpRight, Search } from 'lucide-react';

import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';

export const RuleList = () => {
  const { addToast } = useApp();
  const [rules, setRules] = useState([
    {
      id: 'RULE-BASIC',
      code: 'BASIC',
      name: 'Basic Salary',
      category: 'Basic',
      sequence: 1,
      calculationType: 'Percentage',
      amountValue: '100',
      formulaDisplay: '100% of Base Contract Wage',
      status: 'Active',
    },
    {
      id: 'RULE-HRA',
      code: 'HRA',
      name: 'House Rent Allowance',
      category: 'Allowances',
      sequence: 2,
      calculationType: 'Percentage',
      amountValue: '40',
      formulaDisplay: '40% of BASIC',
      status: 'Active',
    },
    {
      id: 'RULE-CONV',
      code: 'CONV',
      name: 'Conveyance Allowance',
      category: 'Allowances',
      sequence: 3,
      calculationType: 'Fixed',
      amountValue: '200',
      formulaDisplay: '$200.00 Fixed Monthly',
      status: 'Active',
    },
    {
      id: 'RULE-GROSS',
      code: 'GROSS',
      name: 'Gross Salary Computation',
      category: 'Gross',
      sequence: 4,
      calculationType: 'Formula',
      amountValue: 'SUM',
      formulaDisplay: 'BASIC + HRA + CONV',
      status: 'Active',
    },
    {
      id: 'RULE-TAX',
      code: 'TAX',
      name: 'Statutory Income Tax Withholding',
      category: 'Deductions',
      sequence: 5,
      calculationType: 'Percentage',
      amountValue: '12',
      formulaDisplay: '12% of GROSS',
      status: 'Active',
    },
    {
      id: 'RULE-NET',
      code: 'NET',
      name: 'Net Pay Amount',
      category: 'Net',
      sequence: 6,
      calculationType: 'Formula',
      amountValue: 'GROSS - DEDUCTIONS',
      formulaDisplay: 'GROSS - TAX',
      status: 'Active',
    },
  ]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoryBadgeVariant = {
    Basic: 'primary',
    Allowances: 'success',
    Gross: 'accent',
    Deductions: 'error',
    Net: 'primary',
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const sortedRules = [...filteredRules].sort((a, b) => a.sequence - b.sequence);

  const handleSaveRule = (savedData) => {
    if (editingRule) {
      setRules((prev) => prev.map((r) => (r.id === savedData.id ? savedData : r)));
      addToast(`Updated salary rule ${savedData.code}`, 'success');
    } else {
      setRules((prev) => [...prev, savedData]);
      addToast(`Created salary rule ${savedData.code}`, 'success');
    }
    setIsFormModalOpen(false);
    setEditingRule(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      addToast(`Deleted salary rule ${deleteTarget.code}`, 'info');
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* FILTER & CONTROL BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search rule code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Basic">Basic Salary</option>
            <option value="Allowances">Allowances</option>
            <option value="Gross">Gross Computation</option>
            <option value="Deductions">Statutory Deductions</option>
            <option value="Net">Net Salary Pay</option>
          </Select>

          <Button 
            variant="primary" 
            size="sm"
            icon={Plus}
            onClick={() => { setEditingRule(null); setIsFormModalOpen(true); }}
          >
            Add Salary Rule
          </Button>
        </div>
      </div>

      {/* DATA TABLE WITH VISUAL SEQUENCE ORDER */}
      <Table headers={['Seq', 'Code', 'Rule Name', 'Category', 'Calculation Type', 'Human-Readable Formula', 'Status', 'Actions']}>
        {sortedRules.map((r) => (
          <tr key={r.id}>
            <td>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                color: '#172554',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem'
              }}>
                {r.sequence}
              </div>
            </td>
            <td><span className="font-mono text-sm font-semibold" style={{ color: '#7C3AED' }}>{r.code}</span></td>
            <td><strong style={{ color: '#0F172A' }}>{r.name}</strong></td>
            <td>
              <Badge variant={categoryBadgeVariant[r.category] || 'neutral'}>
                {r.category}
              </Badge>
            </td>
            <td><span className="text-xs font-medium">{r.calculationType}</span></td>
            <td>
              {/* Human-Readable Formula Display Card */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#0F172A'
              }}>
                <strong>{r.code}</strong>
                <span className="text-muted">→</span>
                <span>{r.formulaDisplay}</span>
              </div>
            </td>
            <td>
              <Badge variant={r.status === 'Active' ? 'success' : 'neutral'} dot>
                {r.status}
              </Badge>
            </td>
            <td>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Edit}
                  onClick={() => { setEditingRule(r); setIsFormModalOpen(true); }}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Trash2}
                  onClick={() => setDeleteTarget(r)}
                  style={{ color: '#E11D48' }}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingRule(null); }}
        title={editingRule ? `Edit Salary Rule: ${editingRule.code}` : 'Create Salary Rule'}
      >
        <RuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => { setIsFormModalOpen(false); setEditingRule(null); }}
        />
      </Modal>

      {/* CONFIRMATION DIALOG FOR RULE DELETION */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Salary Rule"
        message={`Are you sure you want to delete salary rule ${deleteTarget?.code} (${deleteTarget?.name})? Structures incorporating this rule will be updated.`}
        confirmText="Delete Rule"
        variant="danger"
      />
    </div>
  );
};

export default RuleList;
