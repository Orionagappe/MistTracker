#!/usr/bin/env node
// --- MistTracker MVP CLI Interface ---
// Simple command-line interface for testing database operations

import * as MistTracker from './MistTrackerVulkan.js';
import { initializeDatabase } from './MistCausality.js';
import readline from 'readline';

let db;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function displayMenu() {
    console.log('\n=== MistTracker CLI Menu ===');
    console.log('1. Add Timeline Entry');
    console.log('2. Add Category');
    console.log('3. Add Item');
    console.log('4. List Timelines');
    console.log('5. List Categories');
    console.log('6. List Items');
    console.log('7. Query Anomalies');
    console.log('8. Exit');
    
    const choice = await prompt('\nSelect an option (1-8): ');
    return choice.trim();
}

async function addTimelineEntry() {
    const value = await prompt('Enter timeline entry name: ');
    
    try {
        const result = await MistTracker.addTimeIndex(value, db);
        console.log('✓ Timeline entry added:', value);
        console.log('Current timeline:', result);
    } catch (err) {
        console.error('✗ Error adding timeline:', err.message);
    }
}

async function addCategory() {
    const timelineId = await prompt('Enter timeline ID: ');
    const category = await prompt('Enter category name: ');
    
    try {
        const result = await MistTracker.addCategory(parseInt(timelineId), category, db);
        console.log('✓ Category added:', category);
        console.log('Categories:', result);
    } catch (err) {
        console.error('✗ Error adding category:', err.message);
    }
}

async function addItem() {
    const categoryId = await prompt('Enter category ID: ');
    const item = await prompt('Enter item value: ');
    
    try {
        const result = await MistTracker.addItem(parseInt(categoryId), item, db);
        console.log('✓ Item added:', item);
        console.log('Items:', result);
    } catch (err) {
        console.error('✗ Error adding item:', err.message);
    }
}

async function listTimelines() {
    try {
        const timeline = await MistTracker.loadPrimaryLine(db);
        if (timeline.length === 0) {
            console.log('No timeline entries found');
        } else {
            console.log('\n=== Timeline Entries ===');
            timeline.forEach((entry, idx) => {
                console.log(`${idx + 1}. ${entry}`);
            });
        }
    } catch (err) {
        console.error('✗ Error loading timeline:', err.message);
    }
}

async function listCategories() {
    const timelineId = await prompt('Enter timeline ID: ');
    
    try {
        const categories = await MistTracker.loadCategoriesForTime(parseInt(timelineId), db);
        if (categories.length === 0) {
            console.log('No categories found for this timeline entry');
        } else {
            console.log('\n=== Categories ===');
            categories.forEach((cat, idx) => {
                console.log(`${idx + 1}. ${cat}`);
            });
        }
    } catch (err) {
        console.error('✗ Error loading categories:', err.message);
    }
}

async function listItems() {
    const categoryId = await prompt('Enter category ID: ');
    
    try {
        const items = await MistTracker.loadItemsForCategory(parseInt(categoryId), db);
        if (items.length === 0) {
            console.log('No items found for this category');
        } else {
            console.log('\n=== Items ===');
            items.forEach((item, idx) => {
                console.log(`${idx + 1}. ${item}`);
            });
        }
    } catch (err) {
        console.error('✗ Error loading items:', err.message);
    }
}

async function queryAnomalies() {
    try {
        const anomalies = MistTracker.getAllAnomalousResults();
        if (anomalies.length === 0) {
            console.log('No anomalous results found');
        } else {
            console.log('\n=== Anomalous Results ===');
            anomalies.forEach((anomaly, idx) => {
                console.log(`${idx + 1}. Event ID: ${anomaly.event?.id || 'N/A'}`);
                console.log(`   Status: ${anomaly.status || 'pending'}`);
                console.log(`   Confirms: ${anomaly.confirms || 0}, Fails: ${anomaly.fails || 0}`);
            });
        }
    } catch (err) {
        console.error('✗ Error querying anomalies:', err.message);
    }
}

async function main() {
    console.log('=== MistTracker MVP CLI ===\n');
    
    // Initialize database
    try {
        db = await initializeDatabase();
        console.log('✓ CLI initialized and ready\n');
    } catch (err) {
        console.error('✗ Failed to initialize CLI:', err.message);
        process.exit(1);
    }

    // Main loop
    let running = true;
    while (running) {
        const choice = await displayMenu();
        
        switch (choice) {
            case '1':
                await addTimelineEntry();
                break;
            case '2':
                await addCategory();
                break;
            case '3':
                await addItem();
                break;
            case '4':
                await listTimelines();
                break;
            case '5':
                await listCategories();
                break;
            case '6':
                await listItems();
                break;
            case '7':
                await queryAnomalies();
                break;
            case '8':
                running = false;
                console.log('\n✓ Exiting CLI...\n');
                break;
            default:
                console.log('✗ Invalid option');
        }
    }

    rl.close();
    if (db) await db.end();
    process.exit(0);
}

main().catch(console.error);
