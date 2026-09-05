import React, { useState } from 'react';
import { Card, Button } from '../../../components/ui';
import { PayrunWizardStep1 } from './PayrunWizardStep1';
import { PayrunWizardStep2 } from './PayrunWizardStep2';
import { PayrunProcessing } from './PayrunProcessing';
import { PayrunList } from './PayrunList';
import { Play, ArrowLeft } from 'lucide-react';

export const PayrunPage = () => {
  const [wizardStep, setWizardStep] = useState(0); // 0: Directory, 1: Step1 Config, 2: Step2 Employees, 3: Processing
  const [configData, setConfigData] = useState(null);
  const [selectedPayrun, setSelectedPayrun] = useState(null);

  const handleStep1Next = (config) => {
    setConfigData(config);
    setWizardStep(2);
  };

  const handleStep2Create = (result) => {
    setSelectedPayrun(result.payrun || result);
    setWizardStep(3);
  };

  const handleSelectPayrun = (payrun) => {
    setSelectedPayrun(payrun);
    setWizardStep(3);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Payrun Engine & Processing</h1>
          <p className="page-description">
            Configurable 2-Step Payrun Creation Wizard: Period scope, contract eligibility, formula calculation, and compliance validation.
          </p>
        </div>
        {wizardStep > 0 && (
          <div className="page-actions">
            <Button 
              variant="outline" 
              size="sm" 
              icon={ArrowLeft} 
              onClick={() => {
                setSelectedPayrun(null);
                setWizardStep(0);
              }}
            >
              Back to Payrun Directory
            </Button>
          </div>
        )}
      </div>

      {wizardStep === 0 && (
        <PayrunList 
          onStartWizard={() => setWizardStep(1)} 
          onSelectPayrun={handleSelectPayrun}
        />
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
          payrun={selectedPayrun}
          onDone={() => {
            setSelectedPayrun(null);
            setWizardStep(0);
          }}
        />
      )}
    </div>
  );
};

export default PayrunPage;
