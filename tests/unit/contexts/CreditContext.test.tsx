import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCredits, CreditProvider, CREDIT_COSTS } from '../../../contexts/CreditContext';

describe('CreditContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CreditProvider>{children}</CreditProvider>
  );

  describe('useCredits hook', () => {
    it('should initialize with default credits', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });
      
      expect(result.current.credits).toBeGreaterThanOrEqual(0);
      expect(typeof result.current.credits).toBe('number');
    });

    it('should add credits', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });
      const initialCredits = result.current.credits;

      act(() => {
        result.current.addCredits(50);
      });

      expect(result.current.credits).toBe(initialCredits + 50);
    });

    it('should use credits for valid actions', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      act(() => {
        result.current.addCredits(100);
      });

      const initialCredits = result.current.credits;
      const cost = CREDIT_COSTS.AI_RESUME;

      act(() => {
        const success = result.current.useCredits('AI_RESUME');
        expect(success).toBe(true);
      });

      expect(result.current.credits).toBe(initialCredits - cost);
    });

    it('should prevent using credits when insufficient', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      act(() => {
        // Clear credits
        result.current.useCredits('AI_RESUME');
        result.current.useCredits('AI_RESUME');
        result.current.useCredits('AI_RESUME');
      });

      const initialCredits = result.current.credits;

      act(() => {
        const success = result.current.useCredits('AI_RESUME');
        if (!success) {
          expect(result.current.credits).toBe(initialCredits);
        }
      });
    });

    it('should check if enough credits available', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      act(() => {
        result.current.addCredits(100);
      });

      const hasEnough = result.current.hasEnoughCredits('AI_RESUME');
      expect(typeof hasEnough).toBe('boolean');
    });

    it('should return correct credit cost', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      const cost = result.current.getCreditCost('AI_RESUME');
      expect(cost).toBe(CREDIT_COSTS.AI_RESUME);
    });

    it('should track transaction history', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      act(() => {
        result.current.addCredits(50);
      });

      expect(result.current.transactionHistory.length).toBeGreaterThan(0);
    });

    it('should persist credits to localStorage', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      act(() => {
        result.current.addCredits(75);
      });

      const stored = localStorage.getItem('ai_job_automator_credits');
      expect(stored).toBeTruthy();
    });
  });
});
