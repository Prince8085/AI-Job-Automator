import { pool, testConnection } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the database by running the schema SQL file
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    const client = await pool.connect();
    
    try {
      // Execute schema SQL
      await client.query(schemaSql);
      console.log('✅ Database schema created successfully');
      
      // Check if tables were created
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      const tableNames = tablesResult.rows.map(row => row.table_name);
      console.log('📋 Created tables:', tableNames.join(', '));
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

/**
 * Check if database is properly initialized
 */
export const checkDatabaseStatus = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    
    try {
      // Check if main tables exist
      const result = await client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'jobs', 'user_tracked_jobs', 'user_wishlisted_jobs')
      `);
      
      const tableCount = parseInt(result.rows[0].table_count);
      const isInitialized = tableCount >= 4;
      
      if (isInitialized) {
        console.log('✅ Database is properly initialized');
      } else {
        console.log('⚠️ Database needs initialization');
      }
      
      return isInitialized;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to check database status:', error);
    return false;
  }
};

/**
 * Seed database with initial data (optional)
 */
export const seedDatabase = async (): Promise<boolean> => {
  try {
    console.log('🌱 Seeding database with initial data...');
    
    const client = await pool.connect();
    
    try {
      // Add any initial data here if needed
      // For now, we'll just ensure the database is ready
      
      console.log('✅ Database seeding completed');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return false;
  }
};

// Auto-initialize if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const isInitialized = await checkDatabaseStatus();
    
    if (!isInitialized) {
      await initializeDatabase();
      await seedDatabase();
    }
    
    process.exit(0);
  })();
}