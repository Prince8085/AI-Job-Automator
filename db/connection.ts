import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // In browser context, we don't initialize the database connection
  console.warn('Database connection attempted in browser context. Database operations should be handled server-side.');
  export const db = null as any;
  export type Database = any;
} else {
  // Server-side database connection
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = neon(process.env.DATABASE_URL);
  export const db = drizzle(sql, { schema });
  export type Database = typeof db;
}