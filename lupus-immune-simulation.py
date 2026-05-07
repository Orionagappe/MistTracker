#!/usr/bin/env python3
"""
Lupus Immune Dynamics Simulation
Phase 1: Quick Model Implementation
Date: April 24, 2026

Simulates immune system dynamics in established lupus with oral antigen
delivery therapy mechanisms integrated.

Model: 4-population ODE system
- Autoreactive B cells (B_auto)
- Regulatory T cells (T_reg)
- Effector T cells (T_eff)
- Inflammatory signal (I)
"""

import numpy as np
from scipy.integrate import solve_ivp
import json
import csv
from datetime import datetime
from pathlib import Path


class LupusImmuneModel:
    """
    ODE-based model of lupus immune dynamics.
    
    Populations:
    - B_auto: Autoreactive B cells (cells/μL)
    - T_reg: Regulatory T cells (cells/μL)
    - T_eff: Effector T cells (cells/μL)
    - I: Inflammatory signal (normalized units)
    """
    
    def __init__(self):
        """Initialize model parameters from specification."""
        
        # ============================================================
        # B Cell Parameters (dB_auto/dt)
        # ============================================================
        self.r_B = 0.02           # Proliferation rate (/day) - REDUCED for stability
        self.K_I = 1.0            # Inflammation saturation constant
        self.alpha_B = 0.001      # Suppression rate by Tregs (/day per Treg) - REDUCED
        self.mu_B = 0.02          # Death rate (/day) - REDUCED
        
        # ============================================================
        # T Regulatory Parameters (dT_reg/dt)
        # ============================================================
        self.r_T = 5.0            # Baseline production (cells/μL/day) - REDUCED
        self.beta = 0.02          # Delivery-induced induction (/day) - REDUCED
        self.mu_T = 0.05          # Death rate (/day) - REDUCED
        self.gamma = 0.008        # Exhaustion rate (/day per unit I) - REDUCED
        
        # ============================================================
        # T Effector Parameters (dT_eff/dt)
        # ============================================================
        self.r_E = 0.05           # Activation by inflammation (/day) - REDUCED
        self.delta = 0.0005       # Suppression by Tregs (/day per Treg) - REDUCED
        self.mu_E = 0.08          # Death rate (/day) - REDUCED
        self.theta = 0.08         # Drug suppression rate (/day) - REDUCED
        
        # ============================================================
        # Inflammation Parameters (dI/dt)
        # ============================================================
        self.lambda_B = 0.001     # B cell contribution (units per cell) - REDUCED
        self.lambda_E = 0.0005    # T eff contribution (units per cell) - REDUCED
        self.epsilon = 0.002      # Treg suppression rate (/day per Treg) - REDUCED
        self.mu_I = 0.10          # Natural decay (/day) - REDUCED
        self.sigma = 0.10         # Drug suppression (units/day) - REDUCED
    
    def ode_system(self, t, y, drug_dose=0.0, delivery_active=False):
        """
        ODE system for lupus immune dynamics.
        
        State vector y = [B_auto, T_reg, T_eff, I]
        
        Args:
            t: Time (days)
            y: State vector [B_auto, T_reg, T_eff, I]
            drug_dose: Immunosuppression level (0-1, 1=full dose)
            delivery_active: Boolean for delivery mechanism active
            
        Returns:
            dy/dt: Rate of change for each population
        """
        B_auto, T_reg, T_eff, I = y
        
        # Ensure non-negative states
        B_auto = max(B_auto, 0.0)
        T_reg = max(T_reg, 0.0)
        T_eff = max(T_eff, 0.0)
        I = max(I, 0.1)
        
        # ============================================================
        # B Cell Dynamics
        # ============================================================
        # Proliferation driven by inflammation (saturating)
        b_prolif = self.r_B * B_auto * (I / (I + self.K_I))
        
        # Suppression by Tregs
        b_suppress = self.alpha_B * T_reg * B_auto
        
        # Natural death
        b_death = self.mu_B * B_auto
        
        dB_auto_dt = b_prolif - b_suppress - b_death
        
        # ============================================================
        # T Regulatory Dynamics
        # ============================================================
        # Baseline production (inverse relationship with inflammation, capped)
        # Modified to prevent explosion when I is very small
        t_baseline = self.r_T * np.minimum(2.0, I ** -0.3)
        
        # Delivery-induced induction (therapeutic lever)
        delivery_term = self.beta * (1.0 if delivery_active else 0.0)
        
        # Death rate
        t_death = self.mu_T * T_reg
        
        # Exhaustion by inflammation (capped to prevent explosion)
        t_exhaust = self.gamma * np.minimum(I * T_reg, T_reg * 0.5)
        
        dT_reg_dt = t_baseline + delivery_term - t_death - t_exhaust
        
        # ============================================================
        # T Effector Dynamics
        # ============================================================
        # Activation by inflammation
        te_activate = self.r_E * I
        
        # Suppression by Tregs
        te_suppress = self.delta * T_reg * T_eff
        
        # Natural death
        te_death = self.mu_E * T_eff
        
        # Drug suppression
        te_drug = self.theta * drug_dose * T_eff
        
        dT_eff_dt = te_activate - te_suppress - te_death - te_drug
        
        # ============================================================
        # Inflammatory Signal Dynamics
        # ============================================================
        # B cell contribution (capped at non-negative)
        i_b = max(0, self.lambda_B * B_auto)
        
        # T eff contribution
        i_te = max(0, self.lambda_E * T_eff)
        
        # Treg suppression (anti-inflammatory)
        i_suppress = self.epsilon * T_reg
        
        # Natural decay
        i_decay = self.mu_I * max(I, 0.01)  # Prevent log issues
        
        # Drug suppression
        i_drug = self.sigma * drug_dose
        
        dI_dt = i_b + i_te - i_suppress - i_decay - i_drug
        # Cap rate of change to prevent numerical explosion
        dI_dt = np.clip(dI_dt, -2.0, 2.0)
        
        return [dB_auto_dt, dT_reg_dt, dT_eff_dt, dI_dt]
    
    def get_initial_conditions(self, disease_state='lupus'):
        """
        Get initial conditions for different disease states.
        
        Args:
            disease_state: 'healthy', 'lupus', 'severe_lupus'
            
        Returns:
            y0: [B_auto, T_reg, T_eff, I]
        """
        if disease_state == 'healthy':
            # Baseline healthy state
            return [100.0, 200.0, 150.0, 1.0]
        elif disease_state == 'lupus':
            # Established active lupus (1.8x B, 0.6x Treg, 1.6x Teff)
            return [180.0, 120.0, 240.0, 2.5]
        elif disease_state == 'severe_lupus':
            # Severe active lupus
            return [250.0, 80.0, 320.0, 4.0]
        else:
            raise ValueError(f"Unknown disease state: {disease_state}")
    
    def create_treatment_schedule(self, duration_days, scenario_type='none'):
        """
        Create treatment schedule (drug dose and delivery status over time).
        
        Args:
            duration_days: Simulation duration
            scenario_type: 'none', 'standard_care', 'delivery_only', 
                          'combined', 'delivery_maintenance'
            
        Returns:
            Function that returns (drug_dose, delivery_active) for time t
        """
        def schedule(t):
            if scenario_type == 'none':
                # No treatment
                return 0.0, False
            
            elif scenario_type == 'standard_care':
                # Full-dose immunosuppression from day 0
                return 1.0, False
            
            elif scenario_type == 'delivery_only':
                # Oral delivery weekly starting day 0
                # Each dose active for 3 days
                dose_interval = 7  # Days between doses
                time_in_cycle = t % dose_interval
                delivery = 1.0 if time_in_cycle < 3 else 0.0
                return 0.0, delivery
            
            elif scenario_type == 'combined':
                # Standard care + weekly delivery
                dose_interval = 7
                time_in_cycle = t % dose_interval
                delivery = 1.0 if time_in_cycle < 3 else 0.0
                return 1.0, delivery
            
            elif scenario_type == 'delivery_maintenance':
                # Standard care for 60 days, then taper to 0.5 + delivery
                if t < 60:
                    drug = 1.0
                else:
                    drug = 0.5
                
                dose_interval = 7
                time_in_cycle = t % dose_interval
                delivery = 1.0 if time_in_cycle < 3 else 0.0
                return drug, delivery
            
            else:
                raise ValueError(f"Unknown scenario: {scenario_type}")
        
        return schedule
    
    def solve_scenario(self, scenario_type, duration_days=365):
        """
        Solve ODE system for a treatment scenario.
        
        Args:
            scenario_type: Treatment scenario name
            duration_days: Simulation duration
            
        Returns:
            dict with solution and metadata
        """
        # Initial conditions (established lupus)
        y0 = self.get_initial_conditions('lupus')
        
        # Treatment schedule
        schedule = self.create_treatment_schedule(duration_days, scenario_type)
        
        # Time span and evaluation
        t_span = (0, duration_days)
        t_eval = np.linspace(0, duration_days, duration_days + 1)
        
        # Event function: detect remission (B_auto < 110, T_reg > 150, I < 1.2)
        def remission_event(t, y, drug_dose=0.0, delivery_active=False):
            B_auto, T_reg, T_eff, I = y
            return 1 if (B_auto < 110 and T_reg > 150 and I < 1.2) else 0
        
        # ODE solution with schedule
        def ode_wrapper(t, y):
            drug_dose, delivery_active = schedule(t)
            return self.ode_system(t, y, drug_dose, delivery_active)
        
        sol = solve_ivp(
            ode_wrapper,
            t_span,
            y0,
            method='RK45',
            t_eval=t_eval,
            dense_output=False,
            max_step=1.0,  # Limit step size for stability
            rtol=1e-6,
            atol=1e-8
        )
        
        # Extract and compute metrics
        B_auto_traj = sol.y[0]
        T_reg_traj = sol.y[1]
        T_eff_traj = sol.y[2]
        I_traj = sol.y[3]
        t_traj = sol.t
        
        # Remission timeline
        remission_mask = (B_auto_traj < 110) & (T_reg_traj > 150) & (I_traj < 1.2)
        remission_day = np.argmax(remission_mask) if np.any(remission_mask) else None
        
        # Flare dynamics (I > 2.0)
        flare_threshold = 2.0
        high_inflammation_days = np.sum(I_traj > flare_threshold)
        flare_free_days = len(t_traj) - high_inflammation_days
        
        # Peak values
        peak_B_auto = np.max(B_auto_traj)
        peak_I = np.max(I_traj)
        min_T_reg = np.min(T_reg_traj)
        
        return {
            'scenario': scenario_type,
            'duration_days': duration_days,
            'time': t_traj,
            'B_auto': B_auto_traj,
            'T_reg': T_reg_traj,
            'T_eff': T_eff_traj,
            'I': I_traj,
            'remission_day': remission_day,
            'remission_achieved': remission_day is not None,
            'flare_free_days': flare_free_days,
            'flare_free_fraction': flare_free_days / len(t_traj),
            'peak_B_auto': peak_B_auto,
            'peak_inflammation': peak_I,
            'min_T_reg': min_T_reg,
        }


def run_all_scenarios():
    """Run all 5 treatment scenarios and generate results."""
    
    model = LupusImmuneModel()
    scenarios = [
        'none',
        'standard_care',
        'delivery_only',
        'combined',
        'delivery_maintenance'
    ]
    
    results = {}
    for scenario in scenarios:
        print(f"Running scenario: {scenario}...", flush=True)
        result = model.solve_scenario(scenario, duration_days=365)
        results[scenario] = result
    
    return results


def save_results_csv(results, output_dir='./'):
    """Save results to CSV files for each scenario."""
    
    output_path = Path(output_dir) / 'lupus_simulation_results'
    output_path.mkdir(exist_ok=True)
    
    for scenario_name, result in results.items():
        csv_file = output_path / f'{scenario_name}_trajectory.csv'
        
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['day', 'B_auto', 'T_reg', 'T_eff', 'I'])
            
            for i, t in enumerate(result['time']):
                writer.writerow([
                    int(t),
                    f"{result['B_auto'][i]:.2f}",
                    f"{result['T_reg'][i]:.2f}",
                    f"{result['T_eff'][i]:.2f}",
                    f"{result['I'][i]:.3f}"
                ])
    
    return output_path


def save_results_json(results, output_file='./lupus_scenario_metrics.json'):
    """Save summary metrics to JSON."""
    
    summary = {}
    for scenario_name, result in results.items():
        summary[scenario_name] = {
            'remission_achieved': bool(result['remission_achieved']),
            'remission_day': int(result['remission_day']) if result['remission_day'] is not None else None,
            'flare_free_days': int(result['flare_free_days']),
            'flare_free_fraction': float(result['flare_free_fraction']),
            'peak_B_auto': float(result['peak_B_auto']),
            'peak_inflammation': float(result['peak_inflammation']),
            'min_T_reg': float(result['min_T_reg']),
        }
    
    with open(output_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    return output_file


def print_summary(results):
    """Print summary of all scenarios."""
    
    print("\n" + "="*70)
    print("LUPUS IMMUNE DYNAMICS SIMULATION - SCENARIO COMPARISON")
    print("="*70)
    
    scenario_labels = {
        'none': 'A: Baseline (No Treatment)',
        'standard_care': 'B: Standard Care',
        'delivery_only': 'C: Delivery Therapy Only',
        'combined': 'D: Combined Therapy',
        'delivery_maintenance': 'E: Delivery Maintenance'
    }
    
    for scenario_key, scenario_label in scenario_labels.items():
        if scenario_key not in results:
            continue
        
        result = results[scenario_key]
        print(f"\n{scenario_label}")
        print("-" * 70)
        
        if result['remission_achieved']:
            print(f"  ✓ Remission achieved on day {result['remission_day']}")
        else:
            print(f"  ✗ Remission NOT achieved within 365 days")
        
        print(f"  Flare-free: {result['flare_free_days']}/365 days ({result['flare_free_fraction']*100:.1f}%)")
        print(f"  Peak B_auto: {result['peak_B_auto']:.1f} cells/μL")
        print(f"  Peak inflammation: {result['peak_inflammation']:.2f} (baseline=1.0)")
        print(f"  Min T_reg: {result['min_T_reg']:.1f} cells/μL (baseline=200)")


if __name__ == '__main__':
    print("Lupus Immune Dynamics Simulation - Phase 1")
    print(f"Started: {datetime.now().isoformat()}")
    
    # Run simulations
    results = run_all_scenarios()
    
    # Save outputs
    csv_dir = save_results_csv(results)
    json_file = save_results_json(results)
    
    print(f"\nCSV files saved to: {csv_dir}")
    print(f"JSON summary saved to: {json_file}")
    
    # Print summary
    print_summary(results)
    
    print(f"\nCompleted: {datetime.now().isoformat()}")
