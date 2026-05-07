# Beryllium (Element 4) Docker Deployment Procedure

## Status: Ready for Deployment

**Element**: Beryllium (Be)  
**Atomic Number**: 4  
**Node**: node-4 (localhost:5004)  
**Model**: Bohr  
**Coherence Check**: Reference H/He/Li baseline  
**Deployment Date**: April 30, 2026

---

## Pre-Deployment Checklist

- [x] Docker Compose configured (node-4 already defined)
- [x] Test harness script created: `beryllium-deployment.js`
- [x] Reference values set (Bohr model, Z=4)
- [x] H/He/Li swarm validated and coherent
- [x] Output directory exists: `test-env/results/`

---

## Deployment Steps

### 1. Start Full Cluster (if not already running)

```powershell
cd j:\Portfolio Site\Gdocsdev\MistTracker
docker-compose up -d
```

Verify all containers healthy:
```powershell
docker-compose ps
```

Expected:
```
NAME                 STATUS
mist-coordinator     Up (healthy)
mist-node-1 (H)      Up (healthy)
mist-node-2 (He)     Up (healthy)
mist-node-3 (Li)     Up (healthy)
mist-node-4 (Be)     Up (healthy)  ← TARGET
mist-node-5 (B)      Up (healthy)
mist-database        Up (healthy)
mist-cache           Up (healthy)
```

### 2. Run Beryllium Deployment Test Harness

Execute on node-4 via docker-compose:

```powershell
docker-compose exec node-4 node beryllium-deployment.js
```

Expected output:
```
╔════════════════════════════════════════════════════════════════╗
║  BERYLLIUM (Be, Z=4) DEPLOYMENT TEST HARNESS                 ║
║  Model: Bohr                                                   ║
║  Timestamp: 2026-04-30T...                                    ║
╚════════════════════════════════════════════════════════════════╝

📊 Running 3-measurement validation suite...

  ✅ PASS Bohr Radius: 0.0663... Å (error: <1.5%)
  ✅ PASS Ionization Energy: 9.32... eV (error: <1.0%)
  ✅ PASS Ground State Energy: -14.6... eV (error: <2.0%)

📈 Causality Score: 100/100
📈 Residual Error: 0.00...
✅ Tests Passed: 3/3

╔════════════════════════════════════════════════════════════════╗
║ DEPLOYMENT STATUS: ✅ SUCCESS
║ Causality: 100/100
║ Tests: 3/3 passed
║ Output: beryllium.json
╚════════════════════════════════════════════════════════════════╝
```

### 3. Verify Output

Check `test-env/results/beryllium.json`:

```powershell
Get-Content .\test-env\results\beryllium.json | ConvertFrom-Json | Format-Table
```

Expected:
```json
{
  "status": "passed",
  "atom": "Beryllium",
  "model": "Bohr",
  "timestamp": "2026-04-30T...",
  "tests_passed": 3,
  "tests_total": 3,
  "causality_score": 100,
  "residual_error": 0.00...,
  "measurements": {
    "bohr_radius": { ... },
    "ionization_energy": { ... },
    "ground_state_energy": { ... }
  }
}
```

### 4. Verify Swarm Coherence

Compare with H/He/Li baseline:

```powershell
# Display all element results
Get-Content .\test-env\results\*.json | ConvertFrom-Json | Select-Object atom, causality_score, residual_error
```

Expected coherence pattern:
```
atom       causality_score  residual_error
----       ---------------  ---------------
Hydrogen   100              ~0.001
Helium     100              ~0.001
Lithium    100              ~0.001
Beryllium  100              ~0.001  ← Should align with H/He/Li
```

### 5. Update Swarm State

Once Beryllium validates, acknowledge node-4 as active member:

```powershell
# Notify coordinator that node-4 is coherent
curl -X POST http://localhost:5000/api/swarm/acknowledge-node `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"node_id":"node-4","element":"Be","status":"coherent"}'
```

---

## Coherence Validation Criteria

| Metric | Target | Be Result | Status |
|--------|--------|-----------|--------|
| Tests Passed | 3/3 | TBD | Pending |
| Causality Score | ≥100 | TBD | Pending |
| Bohr Radius Error | <1.5% | TBD | Pending |
| Ionization Energy Error | <1.0% | TBD | Pending |
| Ground State Error | <2.0% | TBD | Pending |
| Residual Error | <0.002 | TBD | Pending |
| Swarm Alignment | ±0.0005 vs H/He/Li | TBD | Pending |

---

## Troubleshooting

### Container won't start
```powershell
docker-compose logs node-4
```

### Test harness fails
```powershell
docker-compose exec node-4 bash
node beryllium-deployment.js
```

### Output not generated
Verify directory exists:
```powershell
mkdir -Force .\test-env\results
```

---

## Next Steps (After Beryllium Validates)

1. **Lithium stabilization window**: 5-10 minutes
2. **Boron (Element 5) deployment**: Reference Phase 2g pipeline
3. **6-element swarm coherence check**: All elements must align causality_score ≥100
4. **Proceed to elements 6-20**: Same procedure, one at a time

---

## References

- Docker Compose: `docker-compose.yml`
- Test Harness: `beryllium-deployment.js`
- Atomic Suite: `atomic-domain-validation-suite.js`
- Validator: `atomic-domain-validator-enhanced.js`
- Phase 17 Results: `phase-17-output/`

---

**Status**: Ready to Deploy  
**Date**: 2026-04-30  
**Operator**: User  
**Approval**: Grok + Claude
