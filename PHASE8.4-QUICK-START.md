# Phase 8.4: Integration Testing - Quick Start

**Execute these steps to run comprehensive integration tests.**

---

## ⚡ Quick Start (10 minutes)

### Step 1: Ensure Prerequisites (2 mins)

```bash
# Check database is set up
mysql -u root -p mist -e "SHOW TABLES;" | grep builder_configs

# Check server is running
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Step 2: Create Test User (2 mins)

```bash
# Create user and capture token
node create-user.js
# Follow prompts, save the JWT token
```

**Output Example:**
```
✓ User registered successfully
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Integration Tests (5 mins)

```bash
# Set token and run tests
TEST_TOKEN="your_token_here" node test-phase8.4-integration.js
```

**Expected Output:**
```
🧪 Phase 8.4: Integration Test Suite

📋 === Test Suite 1: E2E Builder Workflow ===

✓ Create timeline: ID: 123
✓ Save initial config: Stored 2 atoms + 1 emitter
✓ Load config: Retrieved 2 atoms + 1 emitter
✓ Update config: Added atom (now 3 total)
✓ Verify persistence: 3 atoms confirmed
✓ Reset config: Cleared all atoms/emitters

[... more test results ...]

==================================================
📊 Test Summary
==================================================
✓ Passed: 20
✗ Failed: 0

✅ All integration tests passed!
```

---

## 📋 Test Breakdown

### Suite 1: E2E Builder Workflow (6 tests)
- Create timeline
- Save config (2 atoms + 1 emitter)
- Load & verify persistence
- Update config (add atom)
- Reset config

### Suite 2: API Integration (5 tests)
- Concurrent saves
- Large config (50 atoms)
- Empty config edge cases
- API response validation

### Suite 3: Error Handling (5 tests)
- Invalid timeline → 404
- Missing fields → 400
- Complex JSON preservation
- Deep nesting support

### Suite 4: Performance (3 tests)
- Save latency: < 1000ms ✓
- Load latency: < 500ms ✓
- Throughput: 10 ops < 10s ✓

### Suite 5: Data Integrity (3 tests)
- Unicode/emojis preserved ✓
- Float precision preserved ✓
- Timestamps tracking ✓

---

## ✅ Success Criteria

All 20 tests pass = **Integration testing complete** ✅

```
Passed: 20/20 = 100%
```

---

## 🐛 If Tests Fail

### Most Common Issues

**"Cannot connect to server"**
```bash
# Ensure server running
node server.js
```

**"Invalid token"**
```bash
# Create new token
node create-user.js
```

**"Database error"**
```bash
# Re-initialize database
node setup-db.js
```

**"Connection refused" (MySQL)**
```bash
# Start MySQL (macOS)
mysql.server start

# Start MySQL (Linux)
sudo service mysql start
```

### View Full Troubleshooting

See: [PHASE8.4-INTEGRATION-TESTING.md](PHASE8.4-INTEGRATION-TESTING.md#troubleshooting-guide)

---

## 📊 What Gets Tested

| Layer | Component | Status |
|-------|-----------|--------|
| **Frontend** | API calls, error handling | ✅ |
| **Backend** | Endpoints, validation | ✅ |
| **Database** | Persistence, queries | ✅ |
| **Performance** | Latency, throughput | ✅ |
| **Data** | Integrity, precision | ✅ |

---

## 🎯 Phase 8.4 Completion

Once all tests pass:
- ✅ Integration verified
- ✅ Performance benchmarked
- ✅ Errors properly handled
- ✅ Data integrity confirmed

**Ready for Phase 8.5: Release v1.8.0**

---

**Estimated Time: 10 minutes**  
**Complexity: Low (automated tests)**  
**Success Rate: > 95%**
