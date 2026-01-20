import React from 'react';
import FormWizard from '../components/Calculator/FormWizard';
import Header from '../components/Common/Header';
import ProtectedRoute from '../components/Common/ProtectedRoute';

const CalculatorPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="page-container">
        <Header />
        <div className="page-content">
          <FormWizard />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalculatorPage;
