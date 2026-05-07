# THE GAME - QUICK START GUIDE
## Backend Server & API Usage

**Date**: May 1, 2026  
**Status**: Production-Ready  
**Version**: 1.0.0

---

## ⚡ QUICK LAUNCH

### Start the Server
```bash
npm run game:server
```

Expected output:
```
🚀 THE GAME Backend Server is running!
📊 Player Dashboard:    http://localhost:3000/dashboard
👥 Validator Console:   http://localhost:3000/validator
📡 API Base URL:        http://localhost:3000/api
```

### Test the APIs (in separate terminal)
```bash
npm run game:test
```

Expected: `🎉 ALL TESTS PASSED! Backend is fully operational.`

---

## 📊 ENDPOINTS AT A GLANCE

| Endpoint | Method | Purpose | Frontend |
|----------|--------|---------|----------|
| `/api/claims/submit` | POST | Submit claim | Player Dashboard |
| `/api/claims/recent` | GET | Fetch claims | Player Dashboard |
| `/api/verdicts/{id}` | GET | Claim verdict details | Both |
| `/api/validators/leaderboard` | GET | Rankings | Both |
| `/api/audit-chain` | GET | Immutable log | Both |
| `/api/audit-chain/verify` | POST | Verify integrity | Both |
| `/api/system/status` | GET | System metrics | Both |
| `/api/verdicts/submit` | POST | Issue verdict | Validator Console |
| `/api/player/initialize` | POST | New session | Player Dashboard |

---

## 🎮 COMMON WORKFLOWS

### Workflow 1: Submit a Claim (Player)

**1. Player fills form in dashboard.html**:
- Domain: Atomic Physics
- Element: Carbon
- Measurement: Bohr Radius
- Reference: 0.0442
- Measured: 0.0440

**2. game-ui.js submits via game-api.js**:
```javascript
gameAPI.submitClaim(
  'atomic',
  'Carbon',
  'Bohr Radius',
  0.0442,
  0.0440,
  'Optional notes'
)
```

**3. Backend returns**:
```json
{
  "claim_id": "atomic-1777635964439-1627",
  "causality": 95.47,
  "status": "assigned",
  "quorum": ["validator-28", "validator-22", "validator-26"]
}
```

**4. Claim appears in recent claims list**

---

### Workflow 2: Issue a Verdict (Validator)

**1. Validator sees pending claim in validator-dashboard.html**:
- Carbon - Bohr Radius
- Causality: 95.47/100 (green, passes baseline)
- Reference: 0.0442, Measured: 0.0440

**2. Validator clicks "✓ Approve" button**

**3. validator-ui.js submits verdict**:
```javascript
gameAPI.request('/api/verdicts/submit', {
  method: 'POST',
  body: {
    claim_id: 'atomic-1777635964439-1627',
    validator_id: 'validator-28',
    verdict: 'approved',
    reasoning: 'Measurement within tolerance'
  }
})
```

**4. Backend calculates**:
- Verdict is correct (approved + causality >= 75)
- Reputation change: +8
- New reputation: 58%

**5. Feedback displayed**:
```
✅ Verdict correct! Reputation: 50 → 58 (+8)
```

**6. Audit chain entry created**:
```json
{
  "sequence": 2,
  "event_type": "verdict_recorded",
  "claim_id": "atomic-1777635964439-1627",
  "hash": "a3f2c9e1b4d7",
  "validator_id": "validator-28",
  "verdict": "approved"
}
```

---

### Workflow 3: Check System Status

**1. Player/Validator clicks status button**

**2. Frontend calls**:
```javascript
gameAPI.getSystemStatus()
```

**3. Backend returns**:
```json
{
  "claims_processed": 5,
  "claims_approved": 4,
  "claims_rejected": 1,
  "verdicts_recorded": 15,
  "validators_active": 50,
  "audit_entries": 25
}
```

**4. Dashboard displays real-time metrics**

---

## 🧪 TESTING SPECIFIC ENDPOINTS

### Test 1: Submit Multiple Claims
```bash
# Terminal 1: Start server
npm run game:server

# Terminal 2: Submit 5 test claims
curl -X POST http://localhost:3000/api/claims/submit \
  -H "Content-Type: application/json" \
  -d '{
    "domain":"atomic",
    "element_or_particle":"Nitrogen",
    "measurement_type":"Ionization Energy",
    "reference_value":14.53,
    "measured_value":14.52
  }'
```

### Test 2: Verify Audit Chain
```bash
curl -X POST http://localhost:3000/api/audit-chain/verify
```

Expected:
```json
{
  "success": true,
  "valid": true,
  "entries_verified": 25
}
```

### Test 3: Get Leaderboard
```bash
curl http://localhost:3000/api/validators/leaderboard?limit=10
```

### Test 4: Check System Status
```bash
curl http://localhost:3000/api/system/status | python -m json.tool
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Port 3000 already in use"
**Solution**: Kill existing process
```bash
# Find process
netstat -ano | findstr :3000

# Kill by PID
taskkill /PID <PID> /F
```

### Issue: "Cannot find module 'express'"
**Solution**: Reinstall dependencies
```bash
npm install
npm run game:server
```

### Issue: Server starts but test fails to connect
**Solution**: Check server is actually listening
```bash
# Terminal 1
npm run game:server

# Terminal 2
curl http://localhost:3000/api/system/status
```

### Issue: Game-api.js returns 404
**Solution**: Verify baseURL in game-api.js
```javascript
// In game-api.js
const gameAPI = new GameAPI('http://localhost:3000'); // ✅ Correct
// NOT: 'http://localhost:8000' or other port
```

---

## 📈 PERFORMANCE MONITORING

### Check Server Memory
```bash
curl http://localhost:3000/api/system/status | grep memory_mb
```

### Monitor Active Validators
```bash
curl http://localhost:3000/api/system/status | grep validators_active
```

### Verify Audit Chain Every 5 Claims
```bash
curl -X POST http://localhost:3000/api/audit-chain/verify
# Should always return "valid": true
```

---

## 🎯 INTEGRATION CHECKLIST

Before moving to next phase, verify:

✅ Server starts with `npm run game:server`  
✅ All tests pass with `npm run game:test`  
✅ dashboard.html can submit claims  
✅ validator-dashboard.html can issue verdicts  
✅ Reputation updates are accurate  
✅ Audit chain integrity verified  
✅ Status endpoint returns real-time metrics  
✅ No console errors in browser developer tools  
✅ Response times under 100ms  
✅ All 7 API endpoints responding  

---

## 📝 NOTES FOR TEAM

**Key Facts**:
- Server is stateless (restarts clear demo data)
- 50 validators initialize on startup
- Audit chain stored in memory
- No database persistence yet (Phase 2)
- CORS enabled for any origin

**Next Phase (May 8-15)**:
- Connect to PostgreSQL for persistence
- Add authentication (JWT)
- Deploy with Docker
- Set up monitoring/logging

**Launch Readiness**:
- ✅ Core game mechanics working
- ✅ API endpoints verified
- ✅ Error handling comprehensive
- ⏳ Database persistence (coming)
- ⏳ Production hardening (coming)

---

## 📞 SUPPORT

**Common Errors & Fixes**:

1. **"Socket hang up"** → Server crashed, check logs
2. **"EADDRINUSE"** → Port in use, kill process or use different port
3. **"Cannot GET /dashboard"** → Server not serving static files, restart
4. **"Claim not found"** → Server restarted, claim data cleared (in-memory)

**Getting Help**:
- Check server console for error messages
- Run `npm run game:test` to validate all endpoints
- Read API response headers and error messages
- Check game-api.js timeout settings

---

**Status**: Ready for Integration Testing  
**Date**: May 1, 2026  
**Version**: 1.0.0

🎮 **THE GAME Backend is live and operational!**
