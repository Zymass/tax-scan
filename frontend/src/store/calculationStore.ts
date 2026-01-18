import { create } from 'zustand';
import { CalculationData } from '../types';

interface CalculationState {
  currentCalculation: CalculationData | null;
  setCurrentCalculation: (calculation: CalculationData | null) => void;
}

export const useCalculationStore = create<CalculationState>((set) => ({
  currentCalculation: null,
  setCurrentCalculation: (calculation) => set({ currentCalculation: calculation })
}));
