/**
 * Backend Configuration & Environment Setup
 * Centralized configuration for production-level architecture
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || 'localhost',

  // NVIDIA API
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  NVIDIA_API_URL: 'https://integrate.api.nvidia.com/v1/chat/completions',
  NVIDIA_MODEL: 'deepseek-ai/deepseek-v4-flash-0731',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_SIZE: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),

  // Authentication (Clerk)
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

  // Sentry Error Tracking
  SENTRY_DSN: process.env.SENTRY_DSN,

  // Razorpay Payment
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  // API Security
  API_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  API_RATE_LIMIT_MAX: 100,
  AI_API_LIMIT_WINDOW: 60 * 1000, // 1 minute
  AI_API_LIMIT_MAX: 10,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Cors
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],

  // Redis (Cache)
  REDIS_URL: process.env.REDIS_URL,

  // AI Settings
  AI_MAX_TOKENS: 4096,
  AI_TEMPERATURE: 0.7,
  AI_TOP_P: 0.95,
  AI_TOP_K: 20,

  // Validation
  isProduction: () => config.NODE_ENV === 'production',
  isDevelopment: () => config.NODE_ENV === 'development',
  isValidated: () => {
    const required = [
      'DATABASE_URL',
      'NVIDIA_API_KEY',
      'CLERK_SECRET_KEY',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
    ];

    const missing = required.filter(key => !config[key as keyof typeof config]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      return false;
    }

    return true;
  },
};

export default config;
