# Phase 17.2 & 17.2.1 Roadmap - Sequencing & Iterations

**Created**: April 19, 2026  
**Status**: ✅ Planned and Sequenced  
**Duration**: 2 weeks (Phase 17.2 + 17.2.1 parallel execution)

---

## Executive Summary

Phase 17.2 extends Hydrogen proxy training to **multi-atom support** with **distributed cluster deployment**.  
Phase 17.2.1 builds the **research framework** for cross-domain physics integration.

```
Week 3-4: Phase 17.2 → 10 atoms validated on 20-node cluster
Week 5-6: Phase 17.2.1 → Research queries, molecule builder, analytics
Week 7+: Phase 17.2.x → Subatomic physics integration
```

---

## Phase 17.2: Multi-Atom Proxy Foundation

### Goals
1. Scale from 1 atom (Hydrogen) to 10 atoms (H-Ne)
2. Deploy to 20-node cluster with real-time monitoring
3. Generate proxies for all atoms with <2% residual error
4. Create comparative analysis dashboard
5. Establish distributed research infrastructure

### Timeline
**Duration**: 7 days (4 iterations)  
**Start**: After Phase 17.1 completion  
**Resources**: 20-node cluster, 50 GB storage, 1 research engineer

### Iterations

#### Iteration 17.2.0: Foundation & Local Testing (Days 1-2)

**Goal**: Build multi-atom interface and test locally

**Deliverables**:
- [ ] Atom selector component with H, He, Li, Be, B, C, N, O, F, Ne
- [ ] Per-atom training control panel
- [ ] Individual proxy model storage
- [ ] Local proxy comparison UI
- [ ] Unit tests for component logic

**Technical Tasks**:
1. Extend `HydrogenProxyPage.jsx`:
   - Add atom dropdown/grid selector
   - Create per-atom training state management
   - Implement model persistence (localStorage + server)

2. Create new components:
   - `AtomSelector.jsx` - UI for choosing atoms
   - `PerAtomTrainingPanel.jsx` - Training controls per atom
   - `ProxyComparisonMatrix.jsx` - Side-by-side proxy comparison

3. Extend API:
   - `POST /api/analysis/{atom}/train` - Train specific atom
   - `GET /api/analysis/{atom}/status` - Get atom training status
   - `GET /api/analysis/atoms/compare` - Compare all proxies

4. Database:
   - Add columns to hydrogen_proxy_trainings:
     - atom_type (hydrogen, helium, etc.)
     - atomic_number
     - electron_configuration

**Testing**:
- [ ] Train Hydrogen + Helium locally on your machine
- [ ] Verify proxy comparison accuracy
- [ ] Test UI responsiveness with 10 atoms
- [ ] (Optional) Start Docker cluster in background: `docker-compose up -d`
  - Prepares infrastructure for Day 3-4
  - See [DOCKER-SETUP-GUIDE.md](DOCKER-SETUP-GUIDE.md)

**Success Criteria**:
- Local training works for 2 atoms
- UI renders 10 atoms without lag
- Proxies compare correctly
- Docker cluster healthy and ready for Day 3

---

#### Iteration 17.2.1: Cluster Deployment (Days 3-4)

**Goal**: Deploy to 5-node cluster and test aggregation

**Deliverables**:
- [ ] Node status display component
- [ ] Milestone aggregation pipeline
- [ ] Distributed training coordinator
- [ ] Cluster monitoring dashboard
- [ ] Integration tests with 5 nodes

**Technical Tasks**:
1. Backend cluster support:
   - Node heartbeat mechanism
   - Milestone collection service
   - Distributed training orchestrator

2. Frontend cluster display:
   - `ClusterNodeMonitor.jsx` - Display 5 nodes + status
   - `MilestoneAggregation.jsx` - Show milestone streams
   - `DistributedTrainingProgress.jsx` - Global training progress

3. API extensions:
   - `GET /api/cluster/nodes` - List all nodes
   - `GET /api/cluster/milestones` - Aggregated milestones
   - `POST /api/cluster/train-atoms` - Start distributed training
   - `GET /api/cluster/status` - Overall cluster health

4. Database:
   - Add cluster tables:
     - cluster_nodes (node_id, status, last_heartbeat)
     - aggregated_milestones (node_id, atom_type, milestone_type)

**Testing**:
- [ ] Deploy to Docker-based 5-node cluster (local simulation)
  - `docker-compose up -d` to start 5 container nodes
  - See [DOCKER-SETUP-GUIDE.md](DOCKER-SETUP-GUIDE.md) for setup
- [ ] Train Helium, Lithium, Beryllium, Boron, Carbon across 5 nodes
- [ ] Verify milestone aggregation from all nodes
- [ ] Test node failure recovery (kill container, verify recovery)
- [ ] Monitor with `docker-compose logs -f`

**Success Criteria**:
- 5 atoms train in parallel on Docker containers
- Milestones aggregate correctly from all 5 nodes
- Node failure and recovery handled gracefully
- Aggregation latency <5 seconds
- All nodes report healthy status

---

#### Iteration 17.2.2: Visualization & Optimization (Days 5-6)

**Goal**: Add 3D visualization and optimize for 10 atoms on 20 nodes

**Deliverables**:
- [ ] 3D orbital visualization component
- [ ] Error heatmap by orbital type
- [ ] Performance optimization (10 concurrent atoms)
- [ ] Real-time status updates
- [ ] Load testing (validated for 20 nodes)

**Technical Tasks**:
1. 3D visualization:
   - `OrbitalVisualization3D.jsx` - Three.js 3D orbitals
   - `ErrorHeatmap.jsx` - Heat map of prediction errors
   - `AtomComparison3D.jsx` - Side-by-side 3D orbital comparison

2. Performance optimization:
   - Lazy load 3D models
   - Canvas pooling for heatmaps
   - Reduce polling frequency for stable training
   - Cache proxy predictions

3. Real-time updates:
   - WebSocket for live training progress
   - Server-sent events for milestone updates
   - Push notifications for validation complete

4. Load testing:
   - Simulate 20-node cluster training
   - Verify dashboard responsiveness
   - Monitor database query performance

**Testing**:
- [ ] Deploy to full 20-node cluster
- [ ] Train all 10 atoms (H-Ne) in parallel
- [ ] Validate 3D rendering performance
- [ ] Test error heatmap accuracy
- [ ] Load test with 1000 concurrent dashboard views

**Success Criteria**:
- 10 atoms train in parallel on 20 nodes
- Dashboard shows real-time status with <1s latency
- 3D visualization renders at 60 FPS
- Heatmaps update smoothly

---

#### Iteration 17.2.3: Integration & Optimization (Day 7)

**Goal**: Final integration, performance tuning, and handoff

**Deliverables**:
- [ ] Complete system performance tuning
- [ ] Dashboard optimization for scale
- [ ] Documentation and training materials
- [ ] Production deployment checklist
- [ ] Handoff to Phase 17.2.1 team

**Technical Tasks**:
1. Performance tuning:
   - Profile frontend components
   - Optimize database queries
   - Implement caching strategies
   - Reduce message payload sizes

2. Documentation:
   - Architecture diagrams for cluster deployment
   - Troubleshooting guide for common issues
   - Performance baseline documentation
   - Operator runbooks

3. Training:
   - Walkthrough for research team
   - Demo of dashboard features
   - Best practices for cluster monitoring

4. Production readiness:
   - Security audit of cluster communication
   - Backup strategy for milestone data
   - Disaster recovery procedures
   - Monitoring and alerting setup

**Testing**:
- [ ] Stress test with 20-node cluster
- [ ] Verify data consistency across nodes
- [ ] Test backup/recovery procedures
- [ ] Performance profiling

**Success Criteria**:
- All 10 atoms successfully validated
- Dashboard performs smoothly at scale
- Documentation complete
- Team trained and ready

---

## Phase 17.2.1: Distributed Research Framework

### Goals
1. Enable research queries across all atoms
2. Build molecule simulation interface
3. Create convergence analytics
4. Establish bridge to subatomic physics
5. Deliver research platform ready for Phase 17.2.x

### Timeline
**Duration**: 7 days (4 iterations)  
**Parallel with**: Phase 17.2 (overlapping work)  
**Start**: Day 3 of Phase 17.2  
**Resources**: 1 research engineer, 1 data scientist

### Iterations

#### Iteration 17.2.1.0: Research Queries & Comparison (Days 1-2)

**Goal**: Build proxy comparison and parameter sensitivity analysis

**Deliverables**:
- [ ] Proxy accuracy comparison dashboard
- [ ] Parameter sensitivity matrix
- [ ] Convergence pattern analyzer
- [ ] Research query builder UI
- [ ] Query execution engine

**Technical Tasks**:
1. Query framework:
   - `QueryBuilder.jsx` - Drag-and-drop query designer
   - `QueryResult.jsx` - Display query results
   - Query templates (pre-built queries)

2. Comparison dashboard:
   - `ProxyComparisonDashboard.jsx` - Compare all atom proxies
   - `ParameterSensitivityMatrix.jsx` - Show which parameters matter
   - `ConvergencePlot.jsx` - Convergence trajectory by atom

3. Analytics engine:
   - Query executor service
   - Milestone filter/aggregation
   - Statistics calculation
   - Result caching

4. API endpoints:
   - `POST /api/research/query` - Execute research query
   - `GET /api/research/queries` - List saved queries
   - `GET /api/analysis/atoms/comparison` - Compare all proxies
   - `GET /api/analysis/{atom}/sensitivity` - Parameter sensitivity

**Testing**:
- [ ] Test query builder UI
- [ ] Run 10 sample queries
- [ ] Verify comparison accuracy
- [ ] Performance test with large datasets

**Success Criteria**:
- Query builder works intuitively
- Comparison metrics accurate
- Queries execute in <5 seconds

---

#### Iteration 17.2.1.1: Molecule Builder & Ensemble (Days 3-4)

**Goal**: Enable molecule simulation from atom proxies

**Deliverables**:
- [ ] Molecule builder interface
- [ ] Multi-atom configuration storage
- [ ] Ensemble prediction aggregator
- [ ] Molecule simulation results
- [ ] Bonding energy estimation

**Technical Tasks**:
1. Molecule builder:
   - `MoleculeBuilder.jsx` - Drag-to-build molecules
   - `AtomConfigSelector.jsx` - Select atom configurations
   - `BondingControl.jsx` - Define bond distances/angles
   - `MoleculeVisualization.jsx` - 3D molecule rendering

2. Ensemble prediction:
   - Aggregate predictions from multiple atom proxies
   - Calculate molecular properties from atomic proxies
   - Estimate bonding energies
   - Predict reaction barriers (basic)

3. Storage:
   - Save molecule configurations to database
   - Version molecule models
   - Track prediction history

4. API endpoints:
   - `POST /api/molecules/create` - Create molecule
   - `POST /api/molecules/{id}/predict` - Get predictions
   - `GET /api/molecules/list` - List user molecules
   - `POST /api/molecules/{id}/simulate` - Run simulation

**Molecules to support**:
- H₂ (hydrogen molecule)
- H₂O (water)
- CH₄ (methane)
- NH₃ (ammonia)
- CO₂ (carbon dioxide)

**Testing**:
- [ ] Build H₂ molecule and get predictions
- [ ] Test H₂O predictions accuracy
- [ ] Verify ensemble averaging
- [ ] Load test with 100 molecules

**Success Criteria**:
- Molecules build and visualize correctly
- Predictions match full simulation (±5%)
- Ensemble works smoothly

---

#### Iteration 17.2.1.2: Analytics & Reporting (Days 5-6)

**Goal**: Build research analytics and reporting system

**Deliverables**:
- [ ] Convergence statistics queries
- [ ] Convergence analytics dashboard
- [ ] Research report generation
- [ ] Export functionality (JSON, CSV, PDF)
- [ ] Citation/reproducibility metadata

**Technical Tasks**:
1. Analytics:
   - `ConvergenceAnalytics.jsx` - Convergence statistics
   - `AtomComplexityCorrelation.jsx` - Complexity vs convergence time
   - `ResearchInsights.jsx` - Automated insights generator

2. Reporting:
   - Report template system
   - Research summary generation
   - Statistical analysis tools
   - Export engine (JSON, CSV, PDF)

3. Reproducibility:
   - Full parameter capture for each simulation
   - Milestone-based reproducibility
   - Citation generation
   - Research dataset versioning

4. API endpoints:
   - `GET /api/research/analytics` - Get analytics data
   - `POST /api/research/report/generate` - Generate report
   - `GET /api/research/report/{id}` - Retrieve saved report
   - `POST /api/research/export` - Export results

**Research Analytics**:
- Average convergence time by atomic number
- Parameter adjustment frequency by atom
- Proxy accuracy distribution
- Speedup factor analysis
- Emergence rule correlation

**Testing**:
- [ ] Generate 10 different analytics queries
- [ ] Create reports in all formats
- [ ] Verify export accuracy
- [ ] Test reproducibility with saved datasets

**Success Criteria**:
- Analytics queries return correct statistics
- Reports generate without errors
- Export formats are readable and complete
- Reproducibility metadata is captured

---

#### Iteration 17.2.1.3: Optimization & Handoff (Day 7)

**Goal**: Performance optimization and handoff to Phase 17.2.x team

**Deliverables**:
- [ ] Query performance optimization
- [ ] Dashboard responsiveness tuning
- [ ] Research platform documentation
- [ ] Training materials for researchers
- [ ] Handoff checklist complete

**Technical Tasks**:
1. Performance:
   - Profile query execution
   - Optimize database indexes
   - Implement query caching
   - Reduce ensemble calculation time

2. UX polish:
   - Query builder refinement
   - Molecule builder intuitive controls
   - Analytics dashboard clarity
   - Error messages and help text

3. Documentation:
   - Architecture documentation
   - Research workflow guide
   - Query language reference
   - API documentation

4. Training:
   - Walkthrough for Phase 17.2.x team
   - Demo of research capabilities
   - Best practices for cross-domain queries
   - Troubleshooting guide

**Testing**:
- [ ] Load test with 100 concurrent users
- [ ] Query performance on full dataset
- [ ] Molecule builder with 50 molecules
- [ ] Report generation at scale

**Success Criteria**:
- Queries execute smoothly at scale
- Dashboard responsive for 100+ users
- Documentation complete and clear
- Team trained and confident

---

## Phase 17.2.x: Subatomic Physics Integration (Preview)

### Goals (Phase 17.2.x, Week 7+)
1. Bridge atomic and subatomic physics
2. Validate emergence rules across scales
3. Enable next physics domain research
4. Create foundation for Phase 17.3+ domains

### Timeline
**Start**: Week 7 (after Phase 17.2.1)  
**Duration**: 2+ weeks  
**Depends on**: Phase 17.2 & 17.2.1 completion

### Key Features
- Cross-scale proxy comparison
- Nuclear model validation interface
- Quark structure visualization
- Physics emergence rule checker
- Multi-scale interaction simulator

---

## Success Metrics

### Phase 17.2 Success
✅ All 10 atoms (H-Ne) validated on 20-node cluster  
✅ Per-atom proxies with accuracy ≥ 90%  
✅ Cluster uptime ≥ 99.5%  
✅ Dashboard response time < 500ms  
✅ Milestone aggregation latency < 5 seconds  

### Phase 17.2.1 Success
✅ Research query system operational  
✅ 5+ pre-built research queries working  
✅ Molecule builder with 5+ molecules  
✅ Convergence analytics accurate  
✅ Reports generate in <10 seconds  

### Combined Phase 17.2/17.2.1 Success
✅ Multi-atom research platform ready  
✅ Cross-domain query capability established  
✅ Team trained and productive  
✅ Foundation for Phase 17.2.x in place  

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Cluster network latency | Medium | High | Pre-test network, optimize payload sizes |
| Database query performance | Medium | High | Index optimization, query caching |
| 3D rendering performance | Low | Medium | GPU acceleration, LOD rendering |
| Team capacity | Low | High | Parallel iteration execution |
| Data consistency | Low | Critical | Transaction logging, consistency checks |

---

## Dependencies

### Phase 17.2 Dependencies
- Phase 17.1 completion (Hydrogen proxy trained)
- 20-node cluster provisioned
- Database schema extended

### Phase 17.2.1 Dependencies
- Phase 17.2 data available (Days 3+)
- API endpoints available
- Database prepared

---

## Deliverables Checklist

### Phase 17.2
- [ ] Multi-atom UI components
- [ ] Cluster monitoring dashboard
- [ ] 3D orbital visualization
- [ ] Error heatmaps
- [ ] Distributed training coordinator
- [ ] Performance tuning complete
- [ ] Documentation
- [ ] Team training

### Phase 17.2.1
- [ ] Research query builder
- [ ] Proxy comparison dashboard
- [ ] Molecule builder
- [ ] Ensemble prediction engine
- [ ] Analytics dashboards
- [ ] Report generation
- [ ] Export functionality
- [ ] Team training

---

**Status**: ✅ Sequencing complete, ready for implementation  
**Next**: Phase 17.2.0 kicks off after Phase 17.1 completion
