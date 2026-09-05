import React, { useState } from 'react';
import { Card, Table, Badge, Button, Modal } from '../../../components/ui';
import { StructureForm } from './StructureForm';
import { Plus, Edit, Trash2, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';

export const StructureList = () => {
  const { addToast } = useApp();
  const [structures, setStructures] = useState([
    {
      id: 'STRUCT-SWE',
      code: 'STRUCT_SWE_01',
      name: 'Standard Software Engineer Structure',
      description: 'Standard base wage + 40% HRA + $200 Conveyance - 12% Income Tax',
      status: 'Active',
      ruleCodes: ['BASIC', 'HRA', 'CONV', 'GROSS', 'TAX', 'NET'],
      assignedContractsCount: 54,
    },
    {
      id: 'STRUCT-EXEC',
      code: 'STRUCT_EXEC_01',
      name: 'Executive Management Structure',
      description: 'Executive base wage + HRA + Leadership allowance - Tax withholding',
      status: 'Active',
      ruleCodes: ['BASIC', 'HRA', 'GROSS', 'TAX', 'NET'],
      assignedContractsCount: 14,
    },
    {
      id: 'STRUCT-HR',
      code: 'STRUCT_HR_01',
      name: 'HR & Administrative Structure',
      description: 'Administrative staff salary structure with standard allowances',
      status: 'Active',
      ruleCodes: ['BASIC', 'HRA', 'CONV', 'GROSS', 'TAX', 'NET'],
      assignedContractsCount: 18,
    },
  ]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSaveStructure = (savedData) => {
    if (editingStructure) {
      setStructures((prev) => prev.map((s) => (s.id === savedData.id ? savedData : s)));
      addToast(`Updated salary structure ${savedData.name}`, 'success');
    } else {
      setStructures((prev) => [...prev, savedData]);
      addToast(`Created salary structure ${savedData.name}`, 'success');
    }
    setIsFormModalOpen(false);
    setEditingStructure(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setStructures((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      addToast(`Deleted salary structure ${deleteTarget.name}`, 'info');
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Configured Salary Structures</h3>
          <p className="text-sm text-secondary">Structures bind salary rules together to evaluate contract wages.</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          icon={Plus}
          onClick={() => { setEditingStructure(null); setIsFormModalOpen(true); }}
        >
          Create Structure
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {structures.map((struct) => (
          <Card key={struct.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>{struct.name}</h4>
                <span className="font-mono text-xs text-accent font-semibold">{struct.code}</span>
              </div>
              <Badge variant={struct.status === 'Active' ? 'success' : 'neutral'} dot>
                {struct.status}
              </Badge>
            </div>

            <p className="text-xs text-secondary" style={{ marginBottom: '14px' }}>
              {struct.description}
            </p>

            {/* INCLUDED RULES CHIPS */}
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div className="text-xs font-semibold text-muted" style={{ marginBottom: '8px', textTransform: 'uppercase' }}>
                Bound Evaluation Sequence ({struct.ruleCodes.length} Rules)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {struct.ruleCodes.map((code, idx) => (
                  <React.Fragment key={code}>
                    <Badge variant="accent">{code}</Badge>
                    {idx < struct.ruleCodes.length - 1 && <span className="text-xs text-muted">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="text-xs text-secondary">
                Assigned to <strong>{struct.assignedContractsCount || 0}</strong> running contracts
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Edit}
                  onClick={() => { setEditingStructure(struct); setIsFormModalOpen(true); }}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={Trash2}
                  onClick={() => setDeleteTarget(struct)}
                  style={{ color: '#E11D48' }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingStructure(null); }}
        size="lg"
        title={editingStructure ? `Edit Salary Structure: ${editingStructure.name}` : 'Create Salary Structure'}
      >
        <StructureForm
          structure={editingStructure}
          onSave={handleSaveStructure}
          onCancel={() => { setIsFormModalOpen(false); setEditingStructure(null); }}
        />
      </Modal>

      {/* CONFIRMATION DIALOG FOR STRUCTURE DELETION */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Salary Structure"
        message={`Are you sure you want to delete salary structure ${deleteTarget?.name}? Contracts referencing this structure will need re-assignment.`}
        confirmText="Delete Structure"
        variant="danger"
      />
    </div>
  );
};

export default StructureList;
