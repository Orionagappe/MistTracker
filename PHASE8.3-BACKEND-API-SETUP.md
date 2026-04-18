# Phase 8.3 Backend API Setup Guide

## Overview
Phase 8.3 implements backend API support for builder configuration persistence. This allows users to save and load their atom builder configurations to/from the server.

## New Endpoints

### GET `/timelines/:id/builder-config`
Retrieve the saved builder configuration for a timeline.

**Request:**
```
GET /timelines/{timelineId}/builder-config
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "timelineId": 123,
  "config": {
    "atoms": [...],
    "emitters": [...],
    "simulationParams": {...}
  },
  "updatedAt": "2025-04-14T12:30:45.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Builder config not found"
}
```

### PUT `/timelines/:id/builder-config`
Save or update the builder configuration for a timeline.

**Request:**
```
PUT /timelines/{timelineId}/builder-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "config": {
    "atoms": [...],
    "emitters": [...],
    "simulationParams": {...}
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Builder config saved successfully",
  "timelineId": 123,
  "updatedAt": "2025-04-14T12:30:45.000Z"
}
```

## Database Setup

### Option 1: MySQL Command Line

Run the SQL schema file to initialize the database:

```bash
mysql -u <user> -p < database-schema.sql
```

Replace `<user>` with your MySQL username. You'll be prompted for your password.

### Option 2: MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `database-schema.sql`
4. Execute (Ctrl+Shift+Enter or ⌘+Shift+Enter on Mac)

### Option 3: Node.js Script

Create and run a setup script:

```javascript
// setup-db.js
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
  const schema = fs.readFileSync('./database-schema.sql', 'utf8');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password'
  });
  
  // Execute each statement
  for (const statement of schema.split(';')) {
    if (statement.trim()) {
      await connection.query(statement);
    }
  }
  
  await connection.end();
  console.log('✓ Database schema initialized');
}

setupDatabase().catch(console.error);
```

Then run:
```bash
node setup-db.js
```

## Database Schema

The schema creates the following table:

```sql
CREATE TABLE builder_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timeline_id INT NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timeline_id) REFERENCES PrimaryLine(id) ON DELETE CASCADE,
  UNIQUE KEY unique_timeline_config (timeline_id)
);
```

### Key Features:
- `timeline_id`: Foreign key to PrimaryLine table (CASCADE delete)
- `config`: JSON storage for flexible builder configuration
- `created_at`/`updated_at`: Automatic timestamps
- `UNIQUE KEY`: One config per timeline (automatic upsert on update)

## API Integration

The frontend (`useBuilderStorage` hook) automatically handles:

1. **Offline-first storage**: Saves to localStorage immediately
2. **Background sync**: Syncs to server asynchronously
3. **Graceful degradation**: Works offline, with optional server sync
4. **Error handling**: 404s are expected initially (backward compatible)

### How it Works:

1. User opens builder tab
2. Hook loads config from localStorage (instant)
3. Hook attempts server sync in background
4. User makes changes → saved to localStorage immediately
5. Changes are queued for server sync
6. On next sync opportunity, changes sent to server

## Testing the Endpoints

### Using cURL

**Save config:**
```bash
curl -X PUT http://localhost:3000/timelines/1/builder-config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "atoms": [{"id": 1, "element": "H", "x": 0, "y": 0, "z": 0}],
      "emitters": [],
      "simulationParams": {}
    }
  }'
```

**Load config:**
```bash
curl -X GET http://localhost:3000/timelines/1/builder-config \
  -H "Authorization: Bearer <token>"
```

### Using JavaScript/Fetch

```javascript
// Save
const response = await fetch('/timelines/1/builder-config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    config: {
      atoms: [...],
      emitters: [...],
      simulationParams: {...}
    }
  })
});

// Load
const response = await fetch('/timelines/1/builder-config', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## Verification

After setup, verify the endpoints work:

1. Start the server: `node server.js`
2. Create or log in with a user account
3. Create a timeline in the UI
4. Switch to the Builder tab
5. Add atoms: should auto-save to localStorage
6. Refresh page: configuration should persist locally
7. Check browser console for any sync errors
8. Check MySQL: `SELECT * FROM builder_configs;`

## Troubleshooting

### "Builder config not found" (404)

This is expected when:
- First time saving to a timeline
- Database table was created but no config exists yet
- The PUT endpoint will create it on first save

### "Timeline not found" (404)

The referenced timelineId doesn't exist in the database.

### "Error: Access denied for user"

Check MySQL credentials in `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
```

### "Endpoint not found" (404)

Make sure server.js has been updated with the new endpoints (Phase 8.3 changes applied).

## Performance Notes

- JSON storage in MySQL is efficient for moderate config sizes
- Configs up to ~1MB are performant
- Consider archiving old configs if timeline history grows large
- Use indices for quick timeline_id lookups (auto-created in schema)

## Future Enhancements

Phase 8.4+ could add:
- Config versioning/history
- Config diff/merge for collaboration
- Export/import configurations
- Config templates
