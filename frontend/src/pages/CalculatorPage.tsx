import React from 'react';
import FormWizard from '../components/Calculator/FormWizard';
import Header from '../components/Common/Header';

const CalculatorPage: React.FC = () => {
  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <FormWizard />
      </div>
    </div>
  );
};

export default CalculatorPage;
