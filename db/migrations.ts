/**
 * Database Migration System
 * Manages schema versioning and migrations
 */

import { db } from './connection';
import { sql } from 'drizzle-orm';

export interface Migration {
  version: number;
  name: string;
  description: string;
  createdAt: Date;
  executedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Initialize migrations table
 */
export async function initMigrationsTable() {
  try {
    console.log('📋 Initializing migrations table...');

    // Check if migrations table exists
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          executed_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          UNIQUE(name)
        );
      `
    );

    console.log('✅ Migrations table ready');
    return true;
  } catch (error) {
    console.error('❌ Error initializing migrations table:', error);
    throw new Error('Failed to initialize migrations table');
  }
}

/**
 * Register a migration
 */
export async function registerMigration(
  version: number,
  name: string,
  description: string
) {
  try {
    await db.execute(
      sql`
        INSERT INTO schema_migrations (version, name, description, status)
        VALUES (${version}, ${name}, ${description}, 'pending')
        ON CONFLICT (version) DO NOTHING;
      `
    );

    console.log(`✓ Migration ${version} registered: ${name}`);
  } catch (error) {
    console.error('Error registering migration:', error);
  }
}

/**
 * Mark migration as executed
 */
export async function markMigrationExecuted(version: number) {
  try {
    await db.execute(
      sql`
        UPDATE schema_migrations
        SET status = 'completed', executed_at = NOW()
        WHERE version = ${version};
      `
    );

    console.log(`✅ Migration ${version} marked as executed`);
  } catch (error) {
    console.error('Error marking migration:', error);
  }
}

/**
 * Get all pending migrations
 */
export async function getPendingMigrations(): Promise<Migration[]> {
  try {
    const result = await db.execute(
      sql`SELECT * FROM schema_migrations WHERE status = 'pending' ORDER BY version ASC;`
    );

    return (result.rows as any[]) || [];
  } catch (error) {
    console.error('Error getting pending migrations:', error);
    return [];
  }
}

/**
 * Get all executed migrations
 */
export async function getExecutedMigrations(): Promise<Migration[]> {
  try {
    const result = await db.execute(
      sql`SELECT * FROM schema_migrations WHERE status = 'completed' ORDER BY version DESC;`
    );

    return (result.rows as any[]) || [];
  } catch (error) {
    console.error('Error getting executed migrations:', error);
    return [];
  }
}

/**
 * Migration 001: Add audit logging table
 */
export async function migration001_AddAuditLogs() {
  console.log('Running migration 001: Add audit logs table...');

  try {
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(100),
          resource_id UUID,
          old_value JSONB,
          new_value JSONB,
          ip_address VARCHAR(50),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          INDEXES (user_id, action, created_at)
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      `
    );

    await markMigrationExecuted(1);
    console.log('✅ Migration 001 completed');
  } catch (error) {
    console.error('❌ Migration 001 failed:', error);
    throw error;
  }
}

/**
 * Migration 002: Add payment transactions table
 */
export async function migration002_AddPaymentTransactions() {
  console.log('Running migration 002: Add payment transactions table...');

  try {
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          order_id VARCHAR(100) NOT NULL,
          payment_id VARCHAR(100) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          credits INT NOT NULL,
          currency VARCHAR(3) DEFAULT 'INR',
          status VARCHAR(50) DEFAULT 'pending',
          razorpay_signature TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(payment_id),
          UNIQUE(order_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
      `
    );

    await markMigrationExecuted(2);
    console.log('✅ Migration 002 completed');
  } catch (error) {
    console.error('❌ Migration 002 failed:', error);
    throw error;
  }
}

/**
 * Migration 003: Add sessions table for session tracking
 */
export async function migration003_AddSessionsTable() {
  console.log('Running migration 003: Add sessions table...');

  try {
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          clerk_session_id VARCHAR(255),
          ip_address VARCHAR(50),
          user_agent TEXT,
          last_activity TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          INDEXES (user_id, expires_at)
        );
        
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      `
    );

    await markMigrationExecuted(3);
    console.log('✅ Migration 003 completed');
  } catch (error) {
    console.error('❌ Migration 003 failed:', error);
    throw error;
  }
}

/**
 * Migration 004: Add performance indexes for job search and tracking
 */
export async function migration004_AddPerformanceIndexes() {
  console.log('Running migration 004: Add performance indexes...');

  try {
    await db.execute(
      sql`
        CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON jobs USING gin (company gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_jobs_location_trgm ON jobs USING gin (location gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON jobs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tracked_jobs_user_status ON tracked_jobs(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_tracked_jobs_user_created_at ON tracked_jobs(user_id, created_at DESC);
      `
    );

    await markMigrationExecuted(4);
    console.log('✅ Migration 004 completed');
  } catch (error) {
    console.error('❌ Migration 004 failed:', error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Initialize migrations table first
    await initMigrationsTable();

    // Check and register all migrations
    const migrations = [
      { version: 1, name: 'AddAuditLogs', description: 'Add audit logging table' },
      {
        version: 2,
        name: 'AddPaymentTransactions',
        description: 'Add payment transactions table',
      },
      { version: 3, name: 'AddSessionsTable', description: 'Add sessions table' },
      { version: 4, name: 'AddPerformanceIndexes', description: 'Add performance indexes for search and tracker queries' },
    ];

    for (const m of migrations) {
      await registerMigration(m.version, m.name, m.description);
    }

    // Get pending migrations
    const pending = await getPendingMigrations();

    if (pending.length === 0) {
      console.log('✅ All migrations are up to date');
      return;
    }

    console.log(`📋 Running ${pending.length} pending migration(s)...`);

    // Run migrations
    for (const m of pending) {
      switch (m.version) {
        case 1:
          await migration001_AddAuditLogs();
          break;
        case 2:
          await migration002_AddPaymentTransactions();
          break;
        case 3:
          await migration003_AddSessionsTable();
          break;
        case 4:
          await migration004_AddPerformanceIndexes();
          break;
        default:
          console.warn(`⚠️ Unknown migration version: ${m.version}`);
      }
    }

    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new Error('Database migration failed');
  }
}

/**
 * Rollback migrations (be careful!)
 */
export async function rollbackMigration(version: number) {
  try {
    console.log(`🔄 Rolling back migration ${version}...`);

    // Implement rollback logic for each migration
    switch (version) {
      case 1:
        await db.execute(sql`DROP TABLE IF EXISTS audit_logs CASCADE;`);
        break;
      case 2:
        await db.execute(sql`DROP TABLE IF EXISTS payment_transactions CASCADE;`);
        break;
      case 3:
        await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE;`);
        break;
      case 4:
        await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_title_trgm;`);
        await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_company_trgm;`);
        await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_location_trgm;`);
        await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_created_at_desc;`);
        await db.execute(sql`DROP INDEX IF EXISTS idx_tracked_jobs_user_status;`);
        await db.execute(sql`DROP INDEX IF EXISTS idx_tracked_jobs_user_created_at;`);
        break;
    }

    // Mark as rollback
    await db.execute(
      sql`
        UPDATE schema_migrations
        SET status = 'pending'
        WHERE version = ${version};
      `
    );

    console.log(`✅ Migration ${version} rolled back`);
  } catch (error) {
    console.error('Error rolling back migration:', error);
    throw new Error('Rollback failed');
  }
}

export default {
  initMigrationsTable,
  registerMigration,
  markMigrationExecuted,
  getPendingMigrations,
  getExecutedMigrations,
  runMigrations,
  rollbackMigration,
};
