# Lupus Immune Dynamics Simulation - Technical Specification

**Date**: April 24, 2026  
**Purpose**: Model immune system dynamics in established lupus and test oral antigen delivery therapeutic mechanisms  
**Integration**: MistTracker Emergence Validation Framework  
**Status**: Phase 1 - Quick Model (1-2 day implementation scope)

---

## **1. Core Model Architecture**

### 1.1 Mathematical Framework
**Type**: System of coupled Ordinary Differential Equations (ODEs)  
**Time scale**: Days (relevant for immune cell dynamics, treatment effects)  
**Populations**: 4 primary cell types

### 1.2 Cell Populations Modeled

| Population | Symbol | Role | Initial Condition (Lupus) |
|-----------|--------|------|--------------------------|
| Autoreactive B cells | $B_{auto}$ | Produce anti-self antibodies | Elevated (1.5-2x baseline) |
| Regulatory T cells | $T_{reg}$ | Suppress autoimmunity | Reduced (0.5-0.7x baseline) |
| Effector T cells | $T_{eff}$ | Promote inflammation | Elevated (1.3-1.8x baseline) |
| Inflammatory signal | $I$ | Cytokine/complement cascade | Elevated |

**Baseline (healthy) values**:
- $B_{auto}^0 = 100$ cells/μL (or normalized units)
- $T_{reg}^0 = 200$ cells/μL
- $T_{eff}^0 = 150$ cells/μL
- $I^0 = 1.0$ (normalized arbitrary units)

**Lupus initial state** (day 0 of simulation):
- $B_{auto}(0) = 180$ (1.8x baseline, active disease)
- $T_{reg}(0) = 120$ (0.6x baseline, reduced suppression)
- $T_{eff}(0) = 240$ (1.6x baseline, elevated inflammation)
- $I(0) = 2.5$ (elevated inflammation)

---

## **2. ODE System Definition**

### 2.1 Autoreactive B Cell Dynamics
$$\frac{dB_{auto}}{dt} = r_B \cdot B_{auto} \cdot \frac{I}{I + K_I} - \alpha_B \cdot T_{reg} \cdot B_{auto} - \mu_B \cdot B_{auto}$$

**Terms**:
- **Proliferation**: $r_B \cdot B_{auto} \cdot \frac{I}{I + K_I}$
  - Growth rate: $r_B = 0.15$ /day (baseline)
  - Saturation with inflammation: $K_I = 1.0$
  - Drives: more inflammation → more B cell expansion

- **Suppression**: $\alpha_B \cdot T_{reg} \cdot B_{auto}$
  - Suppression rate: $\alpha_B = 0.008$ /day per Treg
  - Rate-limiting: insufficient Tregs in lupus

- **Death**: $\mu_B \cdot B_{auto}$
  - Death rate: $\mu_B = 0.05$ /day (natural turnover)

### 2.2 Regulatory T Cell Dynamics
$$\frac{dT_{reg}}{dt} = r_T \cdot I^{-0.5} + \beta \cdot D_{delivery} - \mu_T \cdot T_{reg} - \gamma \cdot I \cdot T_{reg}$$

**Terms**:
- **Baseline production**: $r_T \cdot I^{-0.5}$
  - Base production rate: $r_T = 25$ cells/μL/day
  - **Inverse inflammation dependence**: high inflammation suppresses Treg generation (realistic)
  - $I^{-0.5}$: loses effect when $I > 4$

- **Delivery-induced induction**: $\beta \cdot D_{delivery}$
  - Induction rate: $\beta = 0.12$ /day (when delivery active)
  - $D_{delivery}$: delivery mechanism activation (0 or 1)
  - **This is the therapeutic lever**: oral antigen delivery drives Treg expansion

- **Death**: $\mu_T \cdot T_{reg}$
  - Death rate: $\mu_T = 0.08$ /day (Tregs turn over)

- **Exhaustion**: $\gamma \cdot I \cdot T_{reg}$
  - Exhaustion rate: $\gamma = 0.04$ /day
  - High inflammation exhausts Tregs (why treatment matters)

### 2.3 Effector T Cell Dynamics
$$\frac{dT_{eff}}{dt} = r_E \cdot I - \delta \cdot T_{reg} \cdot T_{eff} - \mu_E \cdot T_{eff} - \theta \cdot S_{drug} \cdot T_{eff}$$

**Terms**:
- **Activation by inflammation**: $r_E \cdot I$
  - Activation rate: $r_E = 0.25$ /day
  - Feeds back into inflammation loop

- **Treg suppression**: $\delta \cdot T_{reg} \cdot T_{eff}$
  - Suppression rate: $\delta = 0.005$ /day per Treg
  - Only works if Tregs sufficient

- **Natural death**: $\mu_E \cdot T_{eff}$
  - Death rate: $\mu_E = 0.12$ /day (shortest-lived population)

- **Drug suppression**: $\theta \cdot S_{drug} \cdot T_{eff}$
  - Suppression rate: $\theta = 0.30$ /day (strong effect)
  - $S_{drug}$: immunosuppressive medication (0 or 1, or dose-dependent)
  - Represents current standard care (corticosteroids, etc.)

### 2.4 Inflammatory Signal Dynamics
$$\frac{dI}{dt} = \lambda_B \cdot B_{auto} + \lambda_E \cdot T_{eff} - \epsilon \cdot T_{reg} - \mu_I \cdot I - \sigma \cdot S_{drug}$$

**Terms**:
- **B cell contribution**: $\lambda_B \cdot B_{auto}$
  - Rate: $\lambda_B = 0.008$ inflammatory units per B cell
  - Antibodies → immune complex deposition → inflammation

- **T eff contribution**: $\lambda_E \cdot T_{eff}$
  - Rate: $\lambda_E = 0.005$ inflammatory units per T eff
  - Cytokine production

- **Treg suppression**: $\epsilon \cdot T_{reg}$
  - Rate: $\epsilon = 0.015$ /day per Treg
  - Anti-inflammatory cytokines (IL-10, TGF-β)

- **Natural decay**: $\mu_I \cdot I$
  - Decay rate: $\mu_I = 0.20$ /day (half-life ~3.5 days for cytokines)

- **Drug suppression**: $\sigma \cdot S_{drug}$
  - Suppression rate: $\sigma = 0.50$ inflammatory units/day
  - Anti-inflammatory effects of treatment

---

## **3. Delivery Mechanism Model**

### 3.1 Oral Antigen Delivery Activation
$$D_{delivery}(t) = \begin{cases} 1 & \text{if } t \in [t_{dose}, t_{dose} + \tau] \\ 0 & \text{otherwise} \end{cases}$$

**Parameters**:
- **Dosing schedule**: Doses at $t = 0, 7, 14, 21, ...$ days (weekly)
- **Duration per dose**: $\tau = 3$ days (antigen present in gut)
- **Effect magnitude**: $\beta = 0.12$ /day (drives Treg expansion during active window)

### 3.2 Mechanism Interpretation
**What this models**:
1. Oral antigen delivery reaches gut immune cells (GALT)
2. Activates dendritic cells → promotes Treg differentiation
3. Educated Tregs enter bloodstream → systemic suppression
4. Effect wanes after 3 days → requires repeat dosing
5. Needs weeks to accumulate sufficient Treg population

**Biological justification**:
- Gut epithelium survival: acid-resistant coating (3-7 days)
- Immune education lag: 2-5 days for Treg expansion
- Weekly dosing: empirically used in oral tolerance protocols

---

## **4. Treatment Scenarios**

### Scenario A: Baseline Lupus (No Treatment)
- $S_{drug} = 0$ (no medication)
- $D_{delivery} = 0$ (no delivery therapy)
- **Expected outcome**: Progressive deterioration, flares

### Scenario B: Standard Care
- $S_{drug} = 1.0$ (full-dose immunosuppression)
- Represents: hydroxychloroquine + low-dose prednisone
- **Expected outcome**: Disease stabilization, flare suppression

### Scenario C: Delivery Therapy Alone
- $S_{drug} = 0$
- $D_{delivery} = 1$ (weekly dosing starting day 0)
- **Expected outcome**: Slow Treg recovery, modest disease improvement

### Scenario D: Combined (Standard + Delivery)
- $S_{drug} = 1.0$
- $D_{delivery} = 1$ (weekly dosing)
- **Expected outcome**: Synergistic improvement, faster remission

### Scenario E: Delivery as Maintenance (After Drug Taper)
- Days 0-60: $S_{drug} = 1.0$
- Days 60+: $S_{drug} = 0.5$ (reduce to half-dose)
- $D_{delivery} = 1$ (ongoing weekly dosing)
- **Expected outcome**: Test whether delivery therapy allows drug reduction

---

## **5. Success Metrics & Validation**

### 5.1 Primary Outcomes
**Lupus Remission** (target state):
- $B_{auto} < 110$ (near baseline)
- $T_{reg} > 150$ (functional population)
- $I < 1.2$ (low inflammation)

**Time to remission**: Days required to reach target state

**Flare probability**: After reaching remission, days until $I > 2.0$ again (relapse)

### 5.2 Secondary Outcomes
- **Treg recovery rate** (days to reach baseline)
- **Drug exposure**: Total drug dose required
- **Treatment tolerance** (minimum drug dose to prevent flares)

### 5.3 Validation Strategy: Reputation-Only Scoring

**Validation against published data**:

| Data Point | Source | Model Prediction | Acceptance Criteria | Reputation Impact |
|-----------|--------|-----------------|-------------------|------------------|
| Lupus remission timeline | Clinical trials | 30-90 days with combined therapy | ±20% of published | +0.15 |
| Flare-free survival | Cohort studies | >50% at 1 year on therapy | ±15% | +0.10 |
| Oral tolerance efficacy | Preliminary studies | 20-30% improvement in active disease | Match range | +0.10 |
| Treg dynamics | Flow cytometry data | Treg recovery 2-4 weeks | Within published range | +0.10 |
| Mechanism plausibility | Biological literature | Gut→systemic immune education | Framework independent validation | +0.15 |

**Reputation accumulation**:
- Base: 0.0 reputation
- Each validation: +reputation if within acceptable bounds
- Target: ≥0.6 reputation = Model acceptable for prediction

**Reputation loss**:
- Prediction >20% off published data: -0.05
- Mechanism violates known biology: -0.10
- Results non-reproducible (parameter sensitivity): -0.10

---

## **6. Parameter Sensitivity Analysis**

**Critical parameters to test**:
- $\alpha_B$ (B cell suppression by Tregs): ±50%
- $\beta$ (delivery-induced Treg induction): ±40%
- $r_B$ (B cell proliferation): ±30%
- Dosing schedule (weekly vs. bi-weekly vs. daily)
- Initial inflammation level (mild vs. severe lupus)

**Sensitivity matrix**: Parameter × Outcome
- Identify which parameters drive outcomes most
- Determine if results are robust or fragile

---

## **7. Implementation Details**

### 7.1 Computational Approach
- **ODE solver**: Python `scipy.integrate.solve_ivp()` (RK45 method)
- **Time span**: 0-365 days (1 year simulation)
- **Time resolution**: Daily output
- **Scenarios**: Run 4 scenarios in parallel

### 7.2 Output Format
- **CSV files**: Population counts over time for each scenario
- **Plots**: Population dynamics, inflammation trajectory, remission timeline
- **Summary statistics**: Time to remission, flare-free days, drug exposure

### 7.3 Reproducibility
- Fixed random seed (no stochasticity in v1)
- Parameter values in separate config file
- Full differential equations in documentation
- Results archive with git commit hash

---

## **8. Expected Results & Hypotheses**

### Hypothesis 1: Delivery Therapy Alone Insufficient
**Prediction**: Scenario C (delivery alone) shows modest improvement but not remission within 365 days
- **Reasoning**: Established autoimmunity needs suppression + retraining
- **If true**: Validates that delivery is adjunct, not replacement for drugs

### Hypothesis 2: Synergistic Combination Effect
**Prediction**: Scenario D (combined) achieves remission faster than arithmetic sum of effects
- **Reasoning**: Reduced inflammation allows Treg education to work better
- **If true**: Justifies clinical trial design with combination therapy

### Hypothesis 3: Maintenance Feasibility
**Prediction**: Scenario E shows drug taper possible with delivery therapy ongoing
- **Reasoning**: Sustained Treg induction might replace some drug burden
- **If true**: Suggests path to reduced long-term drug exposure

---

## **9. Model Limitations & Future Directions**

### Current Limitations
- Single-compartment model (no tissue-specific effects)
- No antigen specificity (assumes single generic antigen)
- No genetic heterogeneity (all patients identical)
- No stochasticity (no individual flare variability)
- Parameters inferred from literature, not patient-specific

### Phase 2 Expansions
- Multi-tissue model (kidney, joints, skin)
- Personalization (patient-specific parameter fitting)
- Stochastic version (Monte Carlo for flare probability)
- Antigen specificity (multiple epitopes)
- Drug pharmacokinetics (absorption, metabolism, clearance)

---

## **10. Reputation Validation Plan**

**Falsifiability**: Model makes specific, testable predictions
- Can be compared against clinical trial outcomes
- Can be validated against published immune cell dynamics
- Parameters can be fitted to real patient data
- Predictions can be prospectively tested

**Non-negotiable integrity**:
- All assumptions documented
- Parameter sources cited
- Limitations acknowledged upfront
- No hidden mechanism or fitting tricks
- Results reproducible from published code

---

## **Files Generated**
1. `lupus-immune-simulation.py` - ODE system implementation
2. `lupus-validation-data.csv` - Published baseline data for comparison
3. `lupus-scenarios-results.json` - Simulation outputs for all 4 scenarios
4. `lupus-simulation-analysis.md` - Detailed results + reputation scoring
5. This specification document

---

**Next Step**: Implement Python simulation with validation framework integration.
