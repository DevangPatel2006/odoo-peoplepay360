import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Select, Input, Spinner, Alert, EmptyState } from '../../../components/ui';
import { RuleForm } from './RuleForm';
import { Plus, Edit, Trash2, Code, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';
import axiosClient from '../../../api/axiosClient';

export const RuleList = () => {
  const { addToast } = useApp();
  const [structures, setStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch structures on mount
  useEffect(() => {
    let isMounted = true;
    const fetchStructures = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get('/salary-structures');
        const list = Array.isArray(response.data) ? response.data : [];
        if (isMounted) {
          setStructures(list);
          if (list.length > 0 && !selectedStructureId) {
            setSelectedStructureId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load salary structures:', err);
        if (isMounted) setError(err.response?.data?.error?.message || 'Failed to load structures.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStructures();
    return () => { isMounted = false; };
  }, []);

  // Fetch rules whenever selectedStructureId changes
  const fetchRules = async (structId) => {
    if (!structId) return;
    setLoadingRules(true);
    try {
      const response = await axiosClient.get(`/salary-rules/structure/${structId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      setRules(list);
    } catch (err) {
      console.error('Failed to load rules for structure:', err);
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    if (selectedStructureId) {
      fetchRules(selectedStructureId);
    }
  }, [selectedStructureId]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/salary-rules/${deleteTarget.id}`);
      addToast(`Deleted salary rule ${deleteTarget.code}`, 'info');
      setDeleteTarget(null);
      fetchRules(selectedStructureId);
    } catch (err) {
      console.error('Failed to delete salary rule:', err);
      addToast(err.response?.data?.error?.message || 'Failed to delete rule.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.code.toLowerCase().includes(query);
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const sortedRules = [...filteredRules].sort((a, b) => a.sequence - b.sequence);

  const getCalculationSummary = (rule) => {
    if (rule.computation_method === 'Fixed') {
      return `$${parseFloat(rule.fixed_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    if (rule.computation_method === 'Percentage') {
      return `${rule.percentage_value}% of ${rule.percentage_base || 'Base'}`;
    }
    if (rule.computation_method === 'Formula') {
      return rule.formula_expression || 'Formula';
    }
    return 'N/A';
  };

  const getCategoryBadgeVariant = (cat) => {
    switch (cat) {
      case 'Basic': return 'primary';
      case 'Allowance': return 'success';
      case 'Gross': return 'accent';
      case 'Deduction': return 'error';
      case 'Net': return 'primary';
      default: return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Salary Calculation Rules Engine</h3>
          <p className="text-sm text-secondary">Ordered calculation formulas evaluated dynamically by the payroll compute engine.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant="outline" 
            size="sm" 
            icon={RefreshCw} 
            onClick={() => fetchRules(selectedStructureId)} 
            loading={loadingRules}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={Plus}
            disabled={!selectedStructureId}
            onClick={() => { setEditingRule(null); setIsFormModalOpen(true); }}
          >
            Add Salary Rule
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* STRUCTURE SELECTOR & SEARCH BAR */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>Target Structure:</span>
          <Select
            value={selectedStructureId}
            onChange={(e) => setSelectedStructureId(e.target.value)}
            style={{ width: '280px' }}
          >
            {structures.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name} ({s.structure_type || 'Regular'})
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search code or rule name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Basic">Basic</option>
            <option value="Allowance">Allowance</option>
            <option value="Gross">Gross</option>
            <option value="Deduction">Deduction</option>
            <option value="Net">Net</option>
          </Select>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading || loadingRules ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : sortedRules.length === 0 ? (
        <EmptyState 
          title="No Salary Rules Found" 
          description={searchQuery ? "No rules match your filter criteria." : "No rules assigned to this salary structure. Add a rule to start defining wage formulas."} 
        />
      ) : (
        <Table headers={['Seq', 'Code', 'Rule Name', 'Category', 'Method', 'Computation Expression / Value', 'Status', 'Actions']}>
          {sortedRules.map((rule) => (
            <tr key={rule.id}>
              <td><span className="font-mono font-bold text-xs" style={{ color: '#64748B' }}>#{rule.sequence}</span></td>
              <td><span className="font-mono text-sm font-semibold" style={{ color: '#7C3AED' }}>{rule.code}</span></td>
              <td><strong style={{ color: '#0F172A' }}>{rule.name}</strong></td>
              <td>
                <Badge variant={getCategoryBadgeVariant(rule.category)}>
                  {rule.category}
                </Badge>
              </td>
              <td><span className="text-sm font-medium">{rule.computation_method}</span></td>
              <td>
                <span className="font-mono text-xs text-secondary" style={{ maxWidth: '280px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getCalculationSummary(rule)}
                </span>
              </td>
              <td>
                <Badge variant={rule.is_active ? 'success' : 'neutral'} dot>
                  {rule.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    icon={Edit} 
                    onClick={() => { setEditingRule(rule); setIsFormModalOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    icon={Trash2} 
                    onClick={() => setDeleteTarget(rule)}
                    style={{ color: '#E11D48' }}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* FORM MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingRule(null); }}
        title={editingRule ? `Edit Salary Rule: ${editingRule.code}` : 'Add Salary Rule to Structure'}
      >
        <RuleForm
          structureId={selectedStructureId}
          rule={editingRule}
          onSave={() => {
            setIsFormModalOpen(false);
            setEditingRule(null);
            fetchRules(selectedStructureId);
          }}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingRule(null);
          }}
        />
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Salary Rule"
        message={`Are you sure you want to delete rule "${deleteTarget?.code} - ${deleteTarget?.name}"? Formulas referencing this code may fail.`}
        confirmText="Delete Rule"
        variant="danger"
      />
    </div>
  );
};

export default RuleList;
