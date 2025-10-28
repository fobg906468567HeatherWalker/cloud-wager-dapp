/**
 * Forecast Store
 *
 * Zustand store for managing forecast form state
 */

import { create } from 'zustand';
import type { WeatherCondition } from '@/types/weather';

interface ForecastState {
  cityId: number | null;
  condition: WeatherCondition | null;
  stakeEth: string;
  isSubmitting: boolean;

  setCity: (cityId: number) => void;
  setCondition: (condition: WeatherCondition) => void;
  setStake: (stake: string) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

/**
 * Forecast form state management
 */
export const useForecastStore = create<ForecastState>((set) => ({
  cityId: null,
  condition: null,
  stakeEth: '',
  isSubmitting: false,

  setCity: (cityId) => set({ cityId }),
  setCondition: (condition) => set({ condition }),
  setStake: (stakeEth) => set({ stakeEth }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  reset: () => set({
    cityId: null,
    condition: null,
    stakeEth: '',
    isSubmitting: false,
  }),
}));
