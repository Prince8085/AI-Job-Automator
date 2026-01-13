import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

let db: any = null;
let Database: any = null;

if (isBrowser) {
  // In browser context, we don't initialize the database connection
  console.warn('Database connection attempted in browser context. Database operations should be handled server-side.');
  db = null;
  Database = null;
} else {
  // Server-side database connection
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
  Database = typeof db;
}

export { db };
export type { Database };