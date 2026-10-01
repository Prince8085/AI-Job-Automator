/// <reference types="node" />
import { afterEach, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock environment variables
beforeEach(() => {
  process.env.VITE_GEMINI_API_KEY = 'test-key-123';
  process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-clerk-key';
  process.env.VITE_DEMO_MODE = 'true';
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// NOTE: localStorage is left as jsdom's real implementation —
// a mocked one broke persistence tests (getItem always undefined).
