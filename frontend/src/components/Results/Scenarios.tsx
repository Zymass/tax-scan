import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface ScenariosProps {
  calculationId: string;
}

const Scenarios: React.FC<ScenariosProps> = ({ calculationId }) => {
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await apiClient.getScenarios(calculationId);
      setScenarios(response.data);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  return (
    <div className="scenarios">
      <h3>Сценарии</h3>
      {scenarios.length === 0 ? (
        <p>Пока нет созданных сценариев</p>
      ) : (
        <ul>
          {scenarios.map((scenario) => (
            <li key={scenario.id}>{scenario.scenario_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Scenarios;
