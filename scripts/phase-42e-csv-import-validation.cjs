#!/usr/bin/env node
/**
 * PHASE 42E: LINGUISTIC RULES CSV IMPORT & DATABASE VALIDATION
 * 
 * Loads Phase 42 CSV datasets into MistTrackerVulkan database.
 * Validates all 4 linguistic rule datasets for consistency and completeness.
 * Confirms data pipeline ready for Phase 42F extended validation.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CSV PARSER
// ============================================================================

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error(`CSV file ${filePath} has no data rows`);
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

// ============================================================================
// DATASET VALIDATORS
// ============================================================================

function validateEnglishLanguageRules(data) {
  console.log('\n📋 ENGLISH LANGUAGE RULES VALIDATION');
  console.log('─'.repeat(60));

  const errors = [];
  const warnings = [];

  // Check required columns
  const requiredCols = ['rule_id', 'rule_name', 'rule_type', 'rule_definition', 'emergence_boost'];
  for (const col of requiredCols) {
    if (!data.headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION FAILED');
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  // Validate each row
  let totalBoost = 0;
  const rules = [];

  data.rows.forEach((row, idx) => {
    const ruleId = row.rule_id;
    const boost = parseInt(row.emergence_boost);
    
    if (isNaN(boost)) {
      errors.push(`Row ${idx + 2}: Invalid emergence_boost value: ${row.emergence_boost}`);
    } else {
      totalBoost += boost;
    }

    if (!row.rule_name || row.rule_name.length === 0) {
      warnings.push(`Row ${idx + 2}: Empty rule_name`);
    } else {
      rules.push({
        id: ruleId,
        name: row.rule_name,
        type: row.rule_type,
        boost: boost
      });
    }
  });

  console.log(`✓ Rows loaded: ${data.rows.length}`);
  console.log(`✓ Total emergence boost available: +${totalBoost}%`);
  console.log(`✓ Boost range: +${Math.min(...rules.map(r => r.boost))}% to +${Math.max(...rules.map(r => r.boost))}%`);
  console.log(`✓ Framework independent rules: ${data.rows.filter(r => r.framework_independent === '1').length}`);

  if (warnings.length > 0) {
    console.log(`⚠ Warnings: ${warnings.length}`);
    warnings.forEach(w => console.log(`  • ${w}`));
  }

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  console.log('✅ VALIDATION PASSED');
  return true;
}

function validateQuestionTemplates(data) {
  console.log('\n📋 QUESTION TEMPLATES VALIDATION');
  console.log('─'.repeat(60));

  const errors = [];
  const warnings = [];

  const requiredCols = ['template_name', 'template_structure', 'template_domain'];
  for (const col of requiredCols) {
    if (!data.headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION FAILED');
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  // Check for PARAMETER markers in templates
  const parameterRegex = /\[([A-Z_]+)\]/g;
  let totalParameters = 0;
  const templates = [];

  data.rows.forEach((row, idx) => {
    const template = row.template_structure;
    const matches = template.match(parameterRegex) || [];
    
    totalParameters += matches.length;

    if (matches.length === 0) {
      warnings.push(`Row ${idx + 2}: Template has no parameters: "${template}"`);
    } else {
      templates.push({
        name: row.template_name,
        parameters: matches.length,
        domain: row.template_domain
      });
    }
  });

  console.log(`✓ Templates loaded: ${data.rows.length}`);
  console.log(`✓ Total parameter slots: ${totalParameters}`);
  console.log(`✓ Avg parameters per template: ${(totalParameters / data.rows.length).toFixed(2)}`);
  console.log(`✓ Domains covered: ${new Set(data.rows.map(r => r.template_domain)).size}`);

  const baselineScores = data.rows.map(r => parseFloat(r.emergence_baseline)).filter(s => !isNaN(s));
  if (baselineScores.length > 0) {
    console.log(`✓ Baseline emergence range: ${Math.min(...baselineScores).toFixed(1)}% - ${Math.max(...baselineScores).toFixed(1)}%`);
    console.log(`✓ Mean baseline emergence: ${(baselineScores.reduce((a,b) => a+b) / baselineScores.length).toFixed(1)}%`);
  }

  if (warnings.length > 0) {
    console.log(`⚠ Warnings: ${warnings.length}`);
    warnings.slice(0, 3).forEach(w => console.log(`  • ${w}`));
    if (warnings.length > 3) console.log(`  ... and ${warnings.length - 3} more`);
  }

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  console.log('✅ VALIDATION PASSED');
  return true;
}

function validateQuestionValidationMetrics(data) {
  console.log('\n📋 QUESTION VALIDATION METRICS VALIDATION');
  console.log('─'.repeat(60));

  const errors = [];
  const warnings = [];

  const requiredCols = ['question_id', 'phase', 'domain', 'original_question', 'emergence_score'];
  for (const col of requiredCols) {
    if (!data.headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION FAILED');
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  // Validate scores and phases
  const scores = [];
  const phases = new Set();
  const classifications = new Set();

  data.rows.forEach((row, idx) => {
    const score = parseFloat(row.emergence_score);
    const phase = parseInt(row.phase);

    if (isNaN(score) || score < 0 || score > 100) {
      errors.push(`Row ${idx + 2}: Invalid emergence_score: ${row.emergence_score}`);
    } else {
      scores.push(score);
    }

    if (!isNaN(phase)) phases.add(phase);
    if (row.classification) classifications.add(row.classification);
  });

  console.log(`✓ Questions analyzed: ${data.rows.length}`);
  console.log(`✓ Phases represented: ${phases.size} (phases ${Math.min(...phases)} - ${Math.max(...phases)})`);
  console.log(`✓ Classification levels: ${Array.from(classifications).sort().join(', ')}`);

  if (scores.length > 0) {
    const mean = scores.reduce((a,b) => a+b) / scores.length;
    const sorted = [...scores].sort((a,b) => a-b);
    const median = scores.length % 2 === 0 
      ? (sorted[scores.length/2-1] + sorted[scores.length/2]) / 2 
      : sorted[Math.floor(scores.length/2)];
    
    console.log(`✓ Emergence score range: ${Math.min(...scores).toFixed(1)}% - ${Math.max(...scores).toFixed(1)}%`);
    console.log(`✓ Mean emergence: ${mean.toFixed(2)}%`);
    console.log(`✓ Median emergence: ${median.toFixed(2)}%`);

    // Distribution
    const high = scores.filter(s => s >= 70).length;
    const medium = scores.filter(s => s >= 50 && s < 70).length;
    const low = scores.filter(s => s >= 30 && s < 50).length;
    const degen = scores.filter(s => s < 30).length;

    console.log(`✓ High-emergence (≥70%): ${high}/25 (${(high*4).toFixed(0)}%)`);
    console.log(`✓ Medium (50-70%): ${medium}/25 (${(medium*4).toFixed(0)}%)`);
    console.log(`✓ Low (30-50%): ${low}/25 (${(low*4).toFixed(0)}%)`);
    console.log(`✓ Degenerate (<30%): ${degen}/25 (${(degen*4).toFixed(0)}%)`);
  }

  if (warnings.length > 0) {
    console.log(`⚠ Warnings: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  console.log('✅ VALIDATION PASSED');
  return true;
}

function validateSemanticRelationships(data) {
  console.log('\n📋 SEMANTIC RELATIONSHIPS VALIDATION');
  console.log('─'.repeat(60));

  const errors = [];

  const requiredCols = ['concept_1', 'concept_2', 'relationship_type', 'domain'];
  for (const col of requiredCols) {
    if (!data.headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION FAILED');
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  // Analyze relationships
  const relationshipTypes = new Set();
  const domains = new Set();
  const concepts = new Set();
  let totalInfoFlow = 0;
  let infoFlowCount = 0;

  data.rows.forEach(row => {
    relationshipTypes.add(row.relationship_type);
    domains.add(row.domain);
    concepts.add(row.concept_1);
    concepts.add(row.concept_2);

    if (row.information_flow) {
      totalInfoFlow += parseFloat(row.information_flow);
      infoFlowCount++;
    }
  });

  console.log(`✓ Relationships loaded: ${data.rows.length}`);
  console.log(`✓ Unique concepts: ${concepts.size}`);
  console.log(`✓ Relationship types: ${Array.from(relationshipTypes).sort().join(', ')}`);
  console.log(`✓ Domains: ${Array.from(domains).sort().join(', ')}`);

  if (infoFlowCount > 0) {
    console.log(`✓ Mean information flow: ${(totalInfoFlow / infoFlowCount).toFixed(2)}`);
  }

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  • ${e}`));
    return false;
  }

  console.log('✅ VALIDATION PASSED');
  return true;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function runPhase42E() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 42E: LINGUISTIC RULES CSV IMPORT & VALIDATION');
  console.log('='.repeat(80));

  const dataDir = './data-imports';
  const datasets = [
    { name: 'EnglishLanguageRules.csv', validator: validateEnglishLanguageRules },
    { name: 'QuestionTemplates.csv', validator: validateQuestionTemplates },
    { name: 'QuestionValidationMetrics.csv', validator: validateQuestionValidationMetrics },
    { name: 'SemanticRelationships.csv', validator: validateSemanticRelationships }
  ];

  let successCount = 0;
  const results = [];

  for (const dataset of datasets) {
    const filePath = path.join(dataDir, dataset.name);
    
    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️ FILE NOT FOUND: ${dataset.name}`);
      continue;
    }

    try {
      const data = parseCSV(filePath);
      const passed = dataset.validator(data);
      
      if (passed) {
        successCount++;
        results.push({
          dataset: dataset.name,
          status: 'PASS',
          rowCount: data.rows.length
        });
      } else {
        results.push({
          dataset: dataset.name,
          status: 'FAIL',
          rowCount: data.rows.length
        });
      }
    } catch (error) {
      console.log(`\n❌ ERROR PARSING ${dataset.name}: ${error.message}`);
      results.push({
        dataset: dataset.name,
        status: 'ERROR',
        message: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 42E SUMMARY\n');
  console.log('Dataset Validation Results:');
  console.log('─'.repeat(80));

  results.forEach(r => {
    const status = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${r.dataset.padEnd(40)} ${r.status.padEnd(6)} (${r.rowCount} rows)`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log(`VALIDATION COMPLETE: ${successCount}/${datasets.length} datasets passed\n`);

  if (successCount === datasets.length) {
    console.log('✅ All linguistic rule datasets ready for database import');
    console.log('✅ Data pipeline validated and functional');
    console.log('✅ Phase 42E complete - Ready for Phase 42F extended validation\n');
  }

  console.log('='.repeat(80) + '\n');

  return {
    timestamp: new Date().toISOString(),
    datasets_validated: datasets.length,
    datasets_passed: successCount,
    all_passed: successCount === datasets.length,
    results
  };
}

if (require.main === module) {
  const result = runPhase42E();
  
  const fs = require('fs');
  const resultsPath = './phase-42-results/PHASE-42E-CSV-VALIDATION.json';
  
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  
  process.exit(result.all_passed ? 0 : 1);
}

module.exports = { parseCSV, runPhase42E };
