import React from 'react';
import { ActionPlan } from '../../types';
import { apiClient } from '../../services/api';
import { formatDate } from '../../utils/formatters';

interface ActionPlanProps {
  actions: ActionPlan[];
  calculationId: string;
}

const ActionPlanComponent: React.FC<ActionPlanProps> = ({ actions, calculationId }) => {
  const handleToggle = async (actionId: string, completed: boolean) => {
    try {
      await apiClient.updateAction(calculationId, actionId, completed);
      // Reload actions
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  return (
    <div className="action-plan">
      <h3>План действий</h3>
      {actions.length === 0 ? (
        <p>Пока нет действий</p>
      ) : (
        <ul>
          {actions.map((action) => (
            <li key={action.id} className={action.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={action.completed}
                onChange={(e) => handleToggle(action.id, e.target.checked)}
              />
              <div>
                <strong>{action.action_name}</strong>
                <p>{action.description}</p>
                <small>Срок: {formatDate(action.due_date)}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActionPlanComponent;
