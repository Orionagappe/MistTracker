# Phase 8.3: Quick Start Guide

Get the builder configuration backend API up and running in 5 minutes.

---

## ⚡ 5-Minute Setup

### Step 1: Initialize Database (2 mins)

```bash
node setup-db.js
```

**Expected output:**
```
🔄 Connecting to MySQL server...
✓ Connected to localhost:3306
📖 Reading database schema...
✓ Schema file loaded
⚙️  Executing 72 SQL statements...
✓ Database created/verified
✓ Table created: PrimaryLine
✓ Table created: CategoryLine
✓ Table created: ItemLine
✓ Table created: builder_configs
✓ Table created: user_milestones
✓ Index created: idx_timeline_builder_config
...
✅ Database setup completed successfully!
```

### Step 2: Start Server (1 min)

```bash
node server.js
```

**Expected output:**
```
✓ Database initialized successfully
=== MistTracker REST API + WebSocket Server ===
✓ HTTP Server running on http://localhost:3000
✓ WebSocket Server ready at ws://localhost:3000
✓ Database: Connected and initialized
```

### Step 3: Create Test User (1 min)

```bash
node create-user.js
```

**Follow prompts:**
- Username: `testuser`
- Account ID: `test123`
- Password: `password123`

**Expected output:**
```
✓ User registered successfully
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Tests (1 min)

Edit `test-phase8.3-builder-api.js`:

```javascript
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Paste token here
```

Then run:

```bash
node test-phase8.3-builder-api.js
```

**Expected output:**
```
🧪 Phase 8.3 Backend API Tests

✓ Create test timeline: ID: 1
✓ PUT /timelines/:id/builder-config
✓ GET /timelines/:id/builder-config

✓ Config persistence (update and reload)
✓ GET with invalid timeline
✓ GET config before first save

✓ PUT with missing config field

📊 Test Summary:
   ✓ Passed: 8
   ✗ Failed: 0
   Total:  8

✅ All tests passed!
```

---

## 📝 What Was Created

### Database Table
```sql
CREATE TABLE builder_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timeline_id INT NOT NULL,
  config JSON NOT NULL COMMENT 'Builder configuration',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timeline_id) REFERENCES PrimaryLine(id) ON DELETE CASCADE,
  UNIQUE KEY unique_timeline_config (timeline_id)
);
```

### API Endpoints
- `GET /timelines/:id/builder-config` - Load configuration
- `PUT /timelines/:id/builder-config` - Save configuration

### Files
- `database-schema.sql` - Database initialization script
- `setup-db.js` - Automated setup tool
- `test-phase8.3-builder-api.js` - Test suite

---

## 🧪 Manual Testing

### Save Configuration (cURL)

```bash
curl -X PUT http://localhost:3000/timelines/1/builder-config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "atoms": [{"id": "1", "element": "H", "x": 0, "y": 0, "z": 0}],
      "emitters": [],
      "simulationParams": {}
    }
  }'
```

### Load Configuration (cURL)

```bash
curl -X GET http://localhost:3000/timelines/1/builder-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Browser DevTools

```javascript
// In browser console (after login)
const token = localStorage.getItem('authToken');

// Save
fetch('/timelines/1/builder-config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    config: {
      atoms: [...],
      emitters: [...],
      simulationParams: {}
    }
  })
}).then(r => r.json()).then(console.log);

// Load
fetch('/timelines/1/builder-config', {
  method: 'GET',
  headers: {'Authorization': `Bearer ${token}`}
}).then(r => r.json()).then(console.log);
```

---

## ✅ Verification Checklist

- [ ] `setup-db.js` runs without errors
- [ ] All 5 database tables created
- [ ] Server starts successfully
- [ ] Test user created
- [ ] All 8 API tests pass
- [ ] Token from create-user.js works in tests
- [ ] cURL requests work manually
- [ ] Browser console commands execute

---

## 🐛 Troubleshooting

### "Connection refused"
- Check MySQL is running: `mysql.server status`
- Verify port 3306 is open
- Check credentials in .env file

### "Access denied for user"
- Verify MySQL username/password in .env
- Check user privileges: `GRANT ALL PRIVILEGES ON mist.* TO 'root'@'localhost';`

### "No tables created"
- Check file permissions on database-schema.sql
- Verify MySQL user has CREATE privilege
- Run manually: `mysql -u root -p < database-schema.sql`

### Tests fail with 404
- Confirm token is valid (create new user if needed)
- Check server.js has Phase 8.3 endpoints (search for "builder-config")
- Verify timeline ID in tests matches created timeline

### "Table doesn't exist"
- Run `setup-db.js` again with correct MySQL credentials
- Manually verify: `mysql -u root -p mist -e "SHOW TABLES;"`

---

## 🚀 Next Steps

### For Development
1. Use the test suite to verify your changes
2. Add new test cases in test-phase8.3-builder-api.js
3. Monitor performance with performanceMonitor utility

### For Production
1. Run database setup on production MySQL
2. Test with production data
3. Configure database backups
4. Set up monitoring/alerting

### For Frontend
1. Frontend already handles these endpoints gracefully
2. Open builder UI and test saving/loading configs
3. Verify offline functionality (disable network in DevTools)
4. Test config persistence across page reloads

---

## 📚 Documentation References

- **Full Setup Guide:** [PHASE8.3-BACKEND-API-SETUP.md](PHASE8.3-BACKEND-API-SETUP.md)
- **Implementation Details:** [PHASE8.3-IMPLEMENTATION-COMPLETE.md](PHASE8.3-IMPLEMENTATION-COMPLETE.md)
- **Performance Guide:** [PHASE8.2-PERFORMANCE.md](PHASE8.2-PERFORMANCE.md)
- **Error Handling:** [PHASE8-IMPLEMENTATION.md](PHASE8-IMPLEMENTATION.md)

---

## 💡 Tips & Tricks

### Quick Database Reset
```bash
# Backup current data
mysqldump -u root -p mist > backup_$(date +%s).sql

# Reset (re-run setup)
node setup-db.js
```

### Monitor Database
```bash
mysql -u root -p mist

# Check builder configs table
SELECT COUNT(*) as config_count FROM builder_configs;

# See all configs for timeline
SELECT * FROM builder_configs WHERE timeline_id = 1\G

# Clear old configs
DELETE FROM builder_configs WHERE timeline_id NOT IN (SELECT id FROM PrimaryLine);
```

### Test with Real Data
```bash
# Use browser to create and save a config
# Then query to see the JSON:
SELECT config FROM builder_configs LIMIT 1\G
```

---

**Ready to go! Start with `node setup-db.js` and follow the prompts.**
