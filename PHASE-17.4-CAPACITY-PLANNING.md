# Phase 17.4 Capacity Planning & Forecasting

**Purpose:** Plan infrastructure capacity based on growth projections  
**Date:** April 19, 2026  
**Planning Horizon:** 24 months ahead  
**Base Scenario:** Conservative (20% YoY growth)  

---

## Executive Summary

This document provides capacity planning models for Phase 17.4 enterprise platform, projecting infrastructure requirements, costs, and scaling events for the next 24 months.

**Key Finding:** System requires significant scaling at 6-month mark (production traffic > 10k concurrent). Proactive infrastructure investments in months 1-3 required for smooth scaling.

---

## Current Baseline (April 2026)

### Usage Metrics

```
Tenants:              50 (pilot customers)
Concurrent Users:     200 (100 per tenant avg)
Requests/Second:      50 (0.25 req per user)
Data Volume:          10GB (200MB per tenant avg)
Monthly Cost:         $1,500 (all-in infrastructure)

Service Distribution (% of requests):
  - Multi-Tenancy:    5%
  - Dashboard:        30%
  - Compliance:       10%
  - Billing:          5%
  - Workflows:        50%

Peak vs Average: 3x multiplier (peak 150 req/sec)
```

### Infrastructure Setup

```
Instances:            1 (1 vCPU, 2GB RAM)
Database:             1 (PostgreSQL, 50GB)
Cache:                None (MVP)
Monitoring:           Basic (CloudWatch)
Backup:               Manual, weekly

Monthly Cost Breakdown:
  Compute:     $100
  Storage:     $300
  Networking:  $200
  Backup:      $100
  Monitoring:  $200
  ───────────────────
  Total:       $900 + Development costs
```

---

## Growth Scenarios

### Scenario 1: Conservative (20% QoQ Growth)

```
Q1 2026 (Apr-Jun):
  Baseline: 50 tenants, 200 concurrent users

Q2 2026 (Jul-Sep):
  +20% growth: 60 tenants, 240 concurrent users
  Projected: 100 req/sec peak

Q3 2026 (Oct-Dec):
  +20% growth: 72 tenants, 288 concurrent users
  Projected: 150 req/sec peak

Q4 2026 (Jan-Mar):
  +20% growth: 86 tenants, 346 concurrent users
  Projected: 250 req/sec peak

Q1 2027 (Apr-Jun):
  +20% growth: 104 tenants, 415 concurrent users
  Projected: 400 req/sec peak
```

### Scenario 2: Aggressive (50% QoQ Growth)

```
Q1 2026:  50 tenants, 200 users
Q2 2026:  75 tenants, 300 users (150 req/sec peak)
Q3 2026:  113 tenants, 450 users (350 req/sec peak)
Q4 2026:  170 tenants, 675 users (525 req/sec peak)
Q1 2027:  255 tenants, 1000 users (800 req/sec peak)

Risk: Resources exhausted by Q3 2026 without scaling
```

### Scenario 3: Viral Growth (5x in 6 months)

```
Q1 2026:  50 tenants, 200 users
Q2 2026:  250 tenants, 1000 users (1000 req/sec peak)

Risk: System failure without immediate scaling
Opportunity: Massive market adoption
```

---

## Capacity Projections - Conservative Scenario

### Month-by-Month (20% growth)

```
Month  Tenants  Users  Req/s  Instances  DB Size  Cost
─────────────────────────────────────────────────────
Apr    50       200    50     1         10GB     $900
May    60       240    60     1         12GB     $1,100
Jun    72       288    72     1         14GB     $1,300
Jul    86       346    86     2         17GB     $1,500
Aug    104      415    104    2         20GB     $1,600
Sep    125      500    125    3         25GB     $1,800
Oct    150      600    150    3         30GB     $2,000
Nov    180      720    180    4         36GB     $2,200
Dec    216      864    216    4         43GB     $2,400
Jan    260      1036   260    5         52GB     $2,600
Feb    312      1244   312    6         62GB     $2,800
Mar    374      1492   374    7         75GB     $3,000
```

### Quarterly Scaling Events

```
Q2 2026 (Jul):     1 → 2 instances
  Reason: Peak throughput 86 req/sec approaches 100-req limit
  Action: Add 1 instance (100 concurrent per instance)
  Downtime: 15 minutes (rolling deployment)
  Cost increase: $200/month

Q3 2026 (Sep):     2 → 3 instances
  Reason: Peak throughput 125 req/sec
  Action: Add 1 instance
  Cost increase: $200/month

Q4 2026 (Oct):     3 → 4 instances
  Reason: Peak throughput 150 req/sec + buffer
  Action: Add 1 instance
  Cost increase: $200/month

Q1 2027 (Jan):     4 → 5 instances, upgrade DB
  Reason: Peak throughput 260 req/sec + approaching DB limits
  Action: Add 1 instance, upgrade to db.t3.xlarge (dual-core)
  Cost increase: $400/month
  Downtime: 10 minutes (RDS multi-AZ failover)
```

---

## Infrastructure Scaling Timeline

### Timeline 1: Compute Scaling

```
2026 Q1
├─ Apr-Jun: 1 instance (100 concurrent)
└─ Utilization: 40% peak

2026 Q2-Q3
├─ Jul-Aug: 2 instances (200 concurrent)
├─ Sep-Dec: 3 instances (300 concurrent)
└─ Utilization: 45% peak

2026 Q4-2027 Q1
├─ Oct-Dec: 4 instances (400 concurrent)
├─ Jan-Mar: 5-6 instances (500+ concurrent)
└─ Utilization: 50% peak (balanced)

Action Items:
✓ Apr: Setup auto-scaling (trigger at 70% CPU)
✓ Jul: Implement monitoring dashboard
✓ Sep: Setup alert for CPU >80%
✓ Jan: Plan capacity council meeting
```

### Timeline 2: Database Scaling

```
2026 Q1-Q2
├─ Apr-Jun: PostgreSQL single instance
│  └─ t3.medium (2 vCPU, 4GB RAM, 100GB SSD)
│  └─ Bottleneck: CPU at 500+ TPS
└─ Utilization: 40% peak

2026 Q3
├─ Add read replicas (2 replicas)
│  └─ Master: t3.medium (write)
│  └─ Replica 1: t3.small (read)
│  └─ Replica 2: t3.small (read)
├─ All reads → replicas, writes → master
└─ Throughput: 1000+ TPS

2026 Q4
├─ Upgrade master to t3.large (4 vCPU, 8GB)
├─ Upgrade replicas to t3.medium
├─ Enable read scaling (5000+ TPS)
└─ Add time-series DB (InfluxDB) for metrics

2027 Q1
├─ Start sharding (tenant-based)
├─ Migrate 20% tenants to Shard 2
├─ Parallel replication during migration
└─ Reach 10,000+ TPS capacity
```

### Timeline 3: Cache Layer

```
2026 Q2-Q3
├─ Add Redis standalone (2GB)
│  └─ Metric aggregations (1-min TTL)
│  └─ Session cache (24-hour TTL)
└─ Hit ratio: 70%

2026 Q4
├─ Upgrade to Redis cluster (3-node, 6GB total)
│  └─ Automatic failover
│  └─ 3x capacity
└─ Hit ratio: 85%

2027 Q1
├─ Add second cache layer (Memcached for reports)
├─ Cache all dashboard queries
└─ Overall cache efficiency: 90%
```

---

## Cost Projections

### Conservative Scenario (20% growth)

```
┌─────────────────────────────────────────────────────────┐
│ MONTHLY INFRASTRUCTURE COSTS (Conservative Growth)       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ 2026                                                     │
│ Q1 Apr: $ 900    Q2 Jul: $1,500    Q3 Oct: $1,800       │
│ Q1 May: $1,100   Q2 Aug: $1,600    Q3 Nov: $2,000       │
│ Q1 Jun: $1,300   Q2 Sep: $1,800    Q3 Dec: $2,200       │
│                                                           │
│ 2027                                                     │
│ Q1 Jan: $2,400   Q1 Feb: $2,600    Q1 Mar: $2,800       │
│                                                           │
│ TOTAL 2026: $18,500                                      │
│ TOTAL 2027 (first 3 months): $7,800                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Cost by Component

```
Month Apr 2026:
  Compute (1 instance):      $100
  Storage (10GB DB):         $100
  Database (managed):        $200
  Networking:                $200
  Backup:                    $100
  Monitoring:                $150
  ──────────────────────────────
  Total:                     $850

Month Jan 2027 (with scaling):
  Compute (5 instances):     $500
  Storage (52GB DB):         $250
  Database (t3.large + replicas): $600
  Cache (Redis cluster):     $200
  Networking:                $400
  Backup:                    $200
  Monitoring:                $250
  ──────────────────────────────
  Total:                     $2,400
```

### Cost per Tenant

```
Apr 2026: $900 / 50 tenants = $18/tenant/month
Jul 2026: $1,500 / 86 tenants = $17.44/tenant/month (economies of scale)
Jan 2027: $2,400 / 260 tenants = $9.23/tenant/month (further optimization)

Economies of scale benefit:
✓ Shared infrastructure cost
✓ Reduced per-tenant SLA requirements
✓ Bulk discount from vendors
```

---

## Utilization & Reserve Capacity

### CPU Utilization Goals

```
Healthy Utilization: 40-60%
Underutilized: < 40% (waste)
Overutilized: > 60% (risk)
Critical: > 80% (immediate action)

Scaling Strategy:
  When: Average CPU > 60% for 10 minutes
  Action: Provision 1 new instance
  Timeline: 2 minutes provision, 3 minutes warm up
  Result: Brings avg CPU back to ~50%

Reserve Capacity:
  Headroom for spikes: 2-3x average
  Burst capacity: One additional instance always on standby
  Weekend baseline: 20% reduced capacity
```

### Database Utilization

```
Current (Apr 2026):
  QPS: 50 / 500 capacity = 10% utilized
  Storage: 10GB / 100GB = 10% utilized
  Connections: 10 / 100 = 10% utilized
  
Target (Jan 2027):
  QPS: 260 / 10,000 capacity = 2.6% utilized (with replicas & sharding)
  Storage: 52GB / 500GB = 10% utilized
  Connections: 50 / 500 = 10% utilized
  
Growth headroom: 38x QPS capacity buffer (for unexpected growth)
```

---

## Scaling Decision Framework

### When to Scale Up

```
Scale up if ANY of:
  ✓ CPU utilization > 70% for 5 continuous minutes
  ✓ Memory utilization > 80%
  ✓ Database connections > 80% of pool
  ✓ Response time p99 > 1 second
  ✓ Error rate > 0.5%
  ✓ Disk space < 20% free
  ✓ Query queue length > 100

Expected lead time:
  - New instance ready: 2-5 minutes
  - Database replica ready: 10-30 minutes
  - Traffic routed: < 1 minute
  - Total: 3-30 minutes (depends on component)
```

### When to Scale Down

```
Scale down only if ALL of:
  ✓ CPU utilization < 30% for 30 continuous minutes
  ✓ Memory utilization < 50%
  ✓ Request queue empty
  ✓ No pending deployments
  ✓ No scheduled traffic spike
  
Process:
  1. Set instance to "drain" mode (no new requests)
  2. Wait for existing requests to complete (max 60 sec)
  3. Terminate instance
  4. Monitor metrics for 5 minutes
  
Safety net: Never scale below minimum (3 instances in production)
```

---

## Traffic Pattern Analysis

### By Time of Day

```
                Peak
                 █
                 █
    ┌────────────█──────────────┐
    │  7am      ███ 12noon       │
    │          █████             │
    │        ██████              │
    │      ███████               │
    │     ███████               │
    │    ████████               │
    ├────────────────────────────┤
    │         █████ 6pm          │
    │        █████████           │
    │       ███████████          │
    │      ███████████████       │
    │     ██████████████████     │
    │    ████████████████████    │
    │   ████████████ Low ████    │
    │  Midnight          Morning │
    
Peak hour (11am-1pm):   3x average
Afternoon (1-5pm):      2x average
Evening (6-10pm):       1.5x average
Night (11pm-6am):       0.5x average

Recommendation: Size for peak (3x) + 20% buffer
```

### By Day of Week

```
Mon-Wed:  Baseline
Thursday: +25% (finance/reporting)
Friday:   +40% (week-end rush, financial close)
Weekend:  -60% (reduced operations)
Sunday:   -50% (prep for Monday)

Annual Patterns:
  Jan-Mar:  -10% (post-holiday slowdown)
  Apr-Jun:  Baseline
  Jul-Aug:  -20% (summer vacation)
  Sep-Nov:  +30% (fiscal year-end)
  Dec:      +50% (holiday peak, tax prep)
```

### Spike Handling

```
Predictable spikes:
  Month-end close:   +100% for 4 hours
  Quarter-end close: +200% for 8 hours
  Year-end close:    +300% for 24 hours
  
Unpredictable spikes (reserve capacity):
  Marketing campaign: +50% sustained for 1 week
  Viral event:        +500% for 1 hour
  
Strategy:
  ✓ Pre-scale 30 minutes before known spikes
  ✓ Monitor for unexpected spikes
  ✓ Auto-scale on metrics (CPU, latency)
  ✓ Cache aggressively during spikes
```

---

## Disaster Recovery Capacity

### Backup & Recovery Infrastructure

```
Backup Strategy (cost overhead):
  RPO: 1 hour
  RTO: 5 minutes
  
Backup storage: +25% of database size
  Current: 10GB → 2.5GB backup = $50/month
  Future: 52GB → 13GB backup = $250/month

Recovery capacity (unused 90% of time):
  Standby instance pool: +20% cost
  Cross-region replica: +30% cost
  
Total DR overhead: ~30-50% infrastructure cost

Cost/benefit:
  Year 1: Extra $300 → Prevents $50k outage
  ROI: Positive immediately (high-cost services)
```

---

## Cost Optimization Opportunities

### Immediate (Month 1-2)

```
1. Reserved instances
   - Commit to 1-year: 30% discount
   - Savings: $1,200/year
   
2. Auto-scaling schedule
   - Reduce capacity at night
   - Savings: $400/year
   
3. Caching optimization
   - Reduce DB queries 40%
   - Delay scaling by 2 months
   - Savings: $1,500 (deferred)
```

### Medium-term (Month 3-6)

```
1. Database optimization
   - Better indexes: 30% fewer queries
   - Savings: $200/month = $2,400/year
   
2. CDN for dashboards
   - Reduce bandwidth 50%
   - Savings: $100/month = $1,200/year
   
3. Compression
   - Reduce storage 20%
   - Savings: $50/month = $600/year
```

### Long-term (Month 6+)

```
1. Sharding strategy
   - Dedicated DB per shard
   - Optimize each for its data
   - Savings: 30% DB cost = $3,600/year

2. Serverless compute
   - Scale to zero in off-hours
   - Savings: 40% compute = $4,800/year

3. Multi-region optimization
   - Load balancing
   - Cheaper regions for secondary
   - Savings: 20% overall = $3,000/year
```

---

## Capacity Planning Checklist

### Month 1 (April 2026)

- [ ] Establish monitoring baseline
- [ ] Document current utilization
- [ ] Setup auto-scaling rules (triggers at 70%)
- [ ] Configure billing alerts
- [ ] Plan for Q2 (Jul) scaling event
- [ ] Reserve instance quotes for Jul

### Month 3-4 (Jun-July)

- [ ] Monitor growth trend vs forecast
- [ ] Execute Q2 scaling (1 → 2 instances)
- [ ] Performance test with 2 instances
- [ ] Adjust forecast if needed
- [ ] Plan database replicas for Q3

### Month 6-9 (Sep-Oct)

- [ ] Add database replicas
- [ ] Implement caching layer
- [ ] Execute Q3 scaling (2 → 3 instances)
- [ ] Plan Q4 database upgrade
- [ ] Review annual forecast

### Month 12+ (Jan 2027+)

- [ ] Evaluate sharding necessity
- [ ] Plan multi-region expansion
- [ ] Begin sharding implementation
- [ ] Setup disaster recovery
- [ ] Plan for 2027 growth

---

## Success Metrics

### Availability

```
Target: 99.9% (9 hours downtime per year)

Measurement:
  - Monitoring: Continuous health checks
  - Reporting: Monthly SLA report
  - Incident response: < 15 min mean time to recovery
```

### Performance

```
Target (by end of Q1 2027):
  - Avg latency: < 100ms
  - P99 latency: < 500ms
  - Error rate: < 0.1%
  - Throughput: 300+ req/sec sustained

Growth without degradation:
  - Scale from 50 to 260 tenants
  - Latency increases < 10% (100ms → 110ms)
```

### Cost Efficiency

```
Target: <$10/tenant/month by Q4 2026

Current: $18/tenant (Apr)
Q2:      $17.44/tenant
Q3:      $14.40/tenant
Q4:      $9.26/tenant ✓

Driver: Infrastructure cost / tenant decreases with scale
```

---

## Conclusion

The Phase 17.4 platform requires proactive scaling:

**Critical Path:**
1. **Apr-Jun:** Monitor & baseline
2. **Jul:** Scale compute (1→2 instances)
3. **Sep:** Add caching layer
4. **Oct:** Scale compute (2→3), add DB replicas
5. **Jan:** Scale database (upgrade to dual-core)
6. **Future:** Implement sharding at 10k concurrent

**Budget Planning:**
- Q1 2026: $3,300 (3 months)
- Q2 2026: $4,800 (3 months with scaling)
- Q3 2026: $5,400 (higher resources)
- Q4 2026: $6,600 (peak year-end)
- **Total 2026: $20,100**

**Success Factor:** Execute scaling on schedule. Missing any quarter's scaling results in performance degradation and potential outages.

---

**Next Steps:**
1. Review this capacity plan monthly
2. Update forecasts based on actual growth
3. Execute scaling events on schedule
4. Monitor cost vs budget
5. Optimize continuously

**Document Status:** ✅ Complete

