import React, { useState } from 'react';
import { Card, Tabs } from '../../components/ui';
import { PayrunPage } from './payruns/PayrunPage';
import { PayslipList } from './payslips/PayslipList';
import { StructureList } from './salaryStructures/StructureList';
import { RuleList } from './salaryRules/RuleList';

export const SalaryConfigPage = () => {
  const [activeTab, setActiveTab] = useState('payruns');

  const tabs = [
    { id: 'payruns', label: '2-Step Payrun Engine' },
    { id: 'payslips', label: 'Employee Payslips' },
    { id: 'structures', label: 'Salary Structures' },
    { id: 'rules', label: 'Salary Rules Engine' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'payruns' && <PayrunPage />}
        {activeTab === 'payslips' && <PayslipList />}
        {activeTab === 'structures' && <StructureList />}
        {activeTab === 'rules' && <RuleList />}
      </Card>
    </div>
  );
};

export default SalaryConfigPage;
