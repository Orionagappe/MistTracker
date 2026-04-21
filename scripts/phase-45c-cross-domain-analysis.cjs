#!/usr/bin/env node
/**
 * PHASE 45C: CROSS-DOMAIN ANALYSIS ENGINE
 * 
 * Analyzes proofreading results across all 9 domains:
 * - Clarity score distributions
 * - Metric usage patterns
 * - Domain-specific insights
 * - Comparison showing which metrics matter most in which domains
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// ANALYSIS
// ============================================================================

function analyzeCrossDomainPatterns() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 45C: CROSS-DOMAIN ANALYSIS ENGINE');
  console.log('Analyzing Patterns Across 9 Rational Domains');
  console.log('='.repeat(80) + '\n');

  // Load proofreading results
  const resultsPath = './phase-45-results/PHASE-45B-PROOFREAD-RATIONAL-QUESTIONS.json';
  const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

  const proofreaderResults = resultsData.proofread_questions;
  const domainStats = resultsData.domain_statistics;
  const metricUsage = resultsData.metric_usage;

  // ============================================================================
  // 1. CLARITY SCORE ANALYSIS
  // ============================================================================

  console.log('═'.repeat(80));
  console.log('1. CLARITY SCORE ANALYSIS\n');

  const clarityScores = proofreaderResults.map(r => r.clarity_score);
  const avgClarityOverall = clarityScores.reduce((a, b) => a + b) / clarityScores.length;
  const maxClarity = Math.max(...clarityScores);
  const minClarity = Math.min(...clarityScores);

  console.log(`Overall Clarity Metrics:`);
  console.log(`  Average Clarity Score: ${avgClarityOverall.toFixed(1)}/100`);
  console.log(`  Highest: ${maxClarity}/100`);
  console.log(`  Lowest: ${minClarity}/100`);
  console.log(`  Range: ${maxClarity - minClarity}\n`);

  // Clarity distribution by domain
  console.log(`Clarity by Domain (highest to lowest average):\n`);
  const domainRankings = Object.entries(domainStats)
    .map(([domain, stats]) => ({
      domain,
      avg: stats.scores.reduce((a, b) => a + b) / stats.scores.length,
      min: Math.min(...stats.scores),
      max: Math.max(...stats.scores)
    }))
    .sort((a, b) => b.avg - a.avg);

  domainRankings.forEach((d, idx) => {
    console.log(`${idx + 1}. ${d.domain}`);
    console.log(`   Average: ${d.avg.toFixed(1)} | Range: [${d.min}-${d.max}]`);
  });

  // ============================================================================
  // 2. METRIC USAGE PATTERNS
  // ============================================================================

  console.log(`\n\n${'═'.repeat(80)}`);
  console.log('2. METRIC USAGE PATTERNS\n');

  const sortedMetrics = Object.entries(metricUsage)
    .sort((a, b) => b[1] - a[1]);

  console.log(`Metrics by Application Frequency:\n`);
  sortedMetrics.forEach(([metric, count]) => {
    const percentage = (count / proofreaderResults.length * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(count / 5)) + '░'.repeat(Math.max(0, Math.floor((54 - count) / 5)));
    console.log(`${metric.padEnd(25)} ${bar} ${count}/54 (${percentage}%)`);
  });

  // ============================================================================
  // 3. DOMAIN-METRIC AFFINITY MATRIX
  // ============================================================================

  console.log(`\n\n${'═'.repeat(80)}`);
  console.log('3. DOMAIN-METRIC AFFINITY ANALYSIS\n');

  console.log(`Which metrics are most important in which domains?\n`);

  const domainMetricMatrix = {};

  // Build matrix of domain -> metric usage
  proofreaderResults.forEach(result => {
    if (!domainMetricMatrix[result.domain]) {
      domainMetricMatrix[result.domain] = {};
    }
    result.metrics_applied.forEach(metric => {
      domainMetricMatrix[result.domain][metric] = (domainMetricMatrix[result.domain][metric] || 0) + 1;
    });
  });

  // Display matrix
  Object.entries(domainMetricMatrix).forEach(([domain, metrics]) => {
    console.log(`${domain}:`);
    const sortedMetrics = Object.entries(metrics).sort((a, b) => b[1] - a[1]);
    sortedMetrics.forEach(([metric, count]) => {
      console.log(`  ✓ ${metric}: ${count}/6 questions (${(count/6*100).toFixed(0)}%)`);
    });
    console.log('');
  });

  // ============================================================================
  // 4. INSIGHTS AND PATTERNS
  // ============================================================================

  console.log(`\n${'═'.repeat(80)}`);
  console.log('4. KEY INSIGHTS AND PATTERNS\n');

  // Insight 1: Clarity variance by domain
  const variances = Object.entries(domainStats).map(([domain, stats]) => {
    const scores = stats.scores;
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return { domain, variance: Math.sqrt(variance), mean };
  });

  const mostConsistentDomain = variances.reduce((a, b) => a.variance < b.variance ? a : b);
  const mostVariableDomain = variances.reduce((a, b) => a.variance > b.variance ? a : b);

  console.log(`Insight 1: Domain Consistency`);
  console.log(`  Most consistent: ${mostConsistentDomain.domain}`);
  console.log(`    (Std dev: ${mostConsistentDomain.variance.toFixed(2)}, questions stay close to avg)`);
  console.log(`  Most variable: ${mostVariableDomain.domain}`);
  console.log(`    (Std dev: ${mostVariableDomain.variance.toFixed(2)}, clarity varies by question)\n`);

  // Insight 2: Metric specialization
  const metricSpecialization = {};
  Object.entries(domainMetricMatrix).forEach(([domain, metrics]) => {
    Object.entries(metrics).forEach(([metric, count]) => {
      if (!metricSpecialization[metric]) {
        metricSpecialization[metric] = [];
      }
      metricSpecialization[metric].push({ domain, count });
    });
  });

  const mostSpecializedMetric = Object.entries(metricSpecialization)
    .map(([metric, domains]) => {
      const dominantDomain = domains.reduce((a, b) => a.count > b.count ? a : b);
      const concentration = dominantDomain.count / domains.reduce((sum, d) => sum + d.count, 0);
      return { metric, concentration, dominantDomain: dominantDomain.domain };
    })
    .sort((a, b) => b.concentration - a.concentration)[0];

  console.log(`Insight 2: Metric Specialization`);
  console.log(`  Most domain-specific metric: ${mostSpecializedMetric.metric}`);
  console.log(`    Concentrated in: ${mostSpecializedMetric.dominantDomain} (${(mostSpecializedMetric.concentration*100).toFixed(0)}% of applications)\n`);

  // Insight 3: Questions needing most improvement
  const worstQuestions = proofreaderResults
    .sort((a, b) => a.clarity_score - b.clarity_score)
    .slice(0, 3);

  console.log(`Insight 3: Questions Needing Most Improvement`);
  worstQuestions.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ${q.domain} → ${q.subdomain}`);
    console.log(`     Clarity: ${q.clarity_score}/100 | Issues: ${q.issues_detected}`);
  });
  console.log('');

  // Insight 4: Domain clarity gaps
  const avgClarityByDomain = Object.entries(domainStats)
    .map(([domain, stats]) => ({
      domain,
      avg: stats.scores.reduce((a, b) => a + b) / stats.scores.length
    }))
    .sort((a, b) => a.avg - b.avg);

  console.log(`Insight 4: Clarity Gaps Between Domains`);
  const lowestAvg = avgClarityByDomain[0];
  const highestAvg = avgClarityByDomain[avgClarityByDomain.length - 1];
  console.log(`  Least clear: ${lowestAvg.domain} (${lowestAvg.avg.toFixed(1)}/100)`);
  console.log(`  Most clear: ${highestAvg.domain} (${highestAvg.avg.toFixed(1)}/100)`);
  console.log(`  Gap: ${(highestAvg.avg - lowestAvg.avg).toFixed(1)} points\n`);

  // ============================================================================
  // 5. COMPARISON TABLE
  // ============================================================================

  console.log(`\n${'═'.repeat(80)}`);
  console.log('5. COMPREHENSIVE DOMAIN COMPARISON\n');

  console.log(`Domain`.padEnd(25) + `Avg Score`.padEnd(12) + `Issues`.padEnd(8) + `Changes`.padEnd(10) + `Top Metric`);
  console.log('─'.repeat(80));

  proofreaderResults
    .reduce((acc, result) => {
      const existing = acc.find(r => r.domain === result.domain);
      if (!existing) {
        acc.push({
          domain: result.domain,
          clarityScores: [result.clarity_score],
          totalIssues: result.issues_detected,
          totalChanges: result.changes.length,
          metricsApplied: result.metrics_applied
        });
      } else {
        existing.clarityScores.push(result.clarity_score);
        existing.totalIssues += result.issues_detected;
        existing.totalChanges += result.changes.length;
        result.metrics_applied.forEach(m => {
          if (!existing.metricsApplied.includes(m)) {
            existing.metricsApplied.push(m);
          }
        });
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const avgA = a.clarityScores.reduce((x, y) => x + y) / a.clarityScores.length;
      const avgB = b.clarityScores.reduce((x, y) => x + y) / b.clarityScores.length;
      return avgB - avgA;
    })
    .forEach(domainData => {
      const avgScore = (domainData.clarityScores.reduce((a, b) => a + b) / domainData.clarityScores.length).toFixed(1);
      const avgChanges = (domainData.totalChanges / 6).toFixed(1);
      const topMetric = domainData.metricsApplied[0] || 'None';
      
      console.log(
        domainData.domain.padEnd(25) +
        avgScore.padEnd(12) +
        (domainData.totalIssues).toString().padEnd(8) +
        avgChanges.padEnd(10) +
        topMetric
      );
    });

  console.log(`\n${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    phase: 45,
    subphase: 'C',
    overall_metrics: {
      average_clarity: parseFloat(avgClarityOverall.toFixed(1)),
      max_clarity: maxClarity,
      min_clarity: minClarity,
      clarity_range: maxClarity - minClarity
    },
    domain_rankings: domainRankings,
    metric_usage: sortedMetrics.map(([m, c]) => ({ metric: m, count: c, percentage: (c/54*100).toFixed(0) })),
    domain_metric_affinity: domainMetricMatrix,
    insights: {
      most_consistent_domain: mostConsistentDomain.domain,
      most_variable_domain: mostVariableDomain.domain,
      most_specialized_metric: mostSpecializedMetric.metric,
      questions_needing_improvement: worstQuestions.map(q => ({ domain: q.domain, subdomain: q.subdomain, score: q.clarity_score })),
      lowest_clarity_domain: lowestAvg.domain,
      highest_clarity_domain: highestAvg.domain,
      clarity_gap: parseFloat((highestAvg.avg - lowestAvg.avg).toFixed(1))
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const result = analyzeCrossDomainPatterns();

  // Save analysis
  fs.writeFileSync(
    path.join('./phase-45-results', 'PHASE-45C-CROSS-DOMAIN-ANALYSIS.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Cross-domain analysis complete. Results saved to: phase-45-results/PHASE-45C-CROSS-DOMAIN-ANALYSIS.json`);

  process.exit(0);
}

module.exports = {
  analyzeCrossDomainPatterns
};
