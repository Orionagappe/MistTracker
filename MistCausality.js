// --- Mist Causality: Multi-User 4D Definite Item Tracker Entry Point (MVP - Database + CLI) ---

import mysql from 'mysql2/promise';
import * as MistTracker from './MistTrackerVulkan.js';
import { ensureMistDatabase, addTimeIndex, addCategory, addItem, loadPrimaryLine, loadCategoriesForTime, loadItemsForCategory } from './MistTrackerVulkan.js';

/**
 * Initialize database and verify connection
 * @returns {Promise<Object>} Database connection
 */
async function initializeDatabase() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: 's3cur3_9a`55w04d',
            port: parseInt(process.env.DB_PORT) || 3306
        });

        console.log('✓ Database connection established');
        
        // Ensure database and schema exist
        await ensureMistDatabase(db);
        console.log('✓ Mist database schema initialized');
        
        return db;
    } catch (err) {
        console.error('✗ Failed to initialize database:', err.message);
        throw err;
    }
}

/**
 * Main MVP entry point - Database initialization and basic operations
 */
async function main() {
    console.log('=== MistTracker MVP - Database Initialization ===\n');

    try {
        // Initialize database connection
        const db = await initializeDatabase();

        console.log('\n✓ MistTracker is ready for testing');
        console.log('\nAvailable operations:');
        console.log('  - use cli.js for command-line interface');
        console.log('  - use test-db.js for database validation\n');

        // Keep connection open or close if not needed
        // await db.end();
        return db;
    } catch (error) {
        console.error('\n✗ Initialization failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { initializeDatabase };