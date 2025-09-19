#!/usr/bin/env node

/**
 * Database setup script
 * This script initializes the database and sets up the schema
 */

import { config } from 'dotenv';
import { initializeDatabase, checkDatabaseStatus } from '../db/init';

// Load environment variables
config();

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Check current database status
    console.log('1️⃣ Checking database status...');
    const isAlreadyInitialized = await checkDatabaseStatus();
    
    if (isAlreadyInitialized) {
      console.log('✅ Database is already initialized and ready to use!\n');
      return;
    }
    
    // Initialize database
    console.log('\n2️⃣ Initializing database...');
    const initSuccess = await initializeDatabase();
    
    if (!initSuccess) {
      throw new Error('Database initialization failed');
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('🎉 Your AI Job Automator database is ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.error('\n🔧 Please check your database connection and try again.\n');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();