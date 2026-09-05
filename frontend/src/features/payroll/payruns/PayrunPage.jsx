import React, { useState } from 'react';
import { Card, Button } from '../../../components/ui';
import { PayrunWizardStep1 } from './PayrunWizardStep1';
import { PayrunWizardStep2 } from './PayrunWizardStep2';
import { PayrunProcessing } from './PayrunProcessing';
import { PayrunList } from './PayrunList';
import { Play, ArrowLeft } from 'lucide-react';

export const PayrunPage = () => {
  const [wizardStep, setWizardStep] = useState(0); // 0: Directory, 1: Step1 Config, 2: Step2 Employees, 3: Processing/Complete
  const [configData, setConfigData] = useState(null);
  const [payrunResultData, setPayrunResultData] = useState(null);

  const handleStep1Next = (config) => {
    setConfigData(config);
    setWizardStep(2);
  };

  const handleStep2Create = (selectedEmployees) => {
    setPayrunResultData({
      config: configData,
      selectedEmployees,
    });
    setWizardStep(3);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Payrun Engine & Processing</h1>
          <p className="page-description">
            2-Step Payrun Creation Wizard: Configure period scope, target eligible employees, and process rule evaluations.
          </p>
        </div>
        {wizardStep > 0 && (
          <div className="page-actions">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => setWizardStep(0)}>
              Exit Wizard
            </Button>
          </div>
        )}
      </div>

      {wizardStep === 0 && (
        <PayrunList onStartWizard={() => setWizardStep(1)} />
      )}

      {wizardStep === 1 && (
        <PayrunWizardStep1
          initialConfig={configData}
          onNext={handleStep1Next}
          onCancel={() => setWizardStep(0)}
        />
      )}

      {wizardStep === 2 && (
        <PayrunWizardStep2
          config={configData}
          onBack={() => setWizardStep(1)}
          onCreatePayrun={handleStep2Create}
        />
      )}

      {wizardStep === 3 && (
        <PayrunProcessing
          payrunData={payrunResultData}
          onDone={() => setWizardStep(0)}
        />
      )}
    </div>
  );
};

export default PayrunPage;
