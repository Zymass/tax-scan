import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FormWizard from './components/Calculator/FormWizard';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormWizard />} />
        <Route path="/calculator" element={<FormWizard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
