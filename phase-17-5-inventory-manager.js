/**
 * Phase 17.5-Alpha: Enterprise Asset Inventory Management
 * 
 * Import, organize, and manage 1000+ software items
 * from various sources (CSV, databases, APIs)
 */

const fs = require('fs');
const path = require('path');

/**
 * AssetInventoryManager: Manage software asset lifecycle
 */
class AssetInventoryManager {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.importedSources = [];
    this.validationErrors = [];
    this.duplicates = new Map(); // name+version -> [assets]
  }

  /**
   * Import assets from CSV file
   * Expected columns: name, version, category, criticality, systems, owner
   */
  importFromCSV(filePath) {
    console.log(`\n[InventoryManager] Importing from CSV: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(1); // Skip header

      const assets = [];
      const errors = [];

      lines.forEach((line, index) => {
        if (!line.trim()) return;

        try {
          const [name, version, category, criticality, systemsStr, owner] = line.split(',');

          const asset = {
            name: name.trim(),
            version: version.trim(),
            category: category?.trim() || 'library',
            criticality: criticality?.trim() || 'medium',
            systems: systemsStr?.trim().split(';') || [],
            owner: owner?.trim() || 'unknown'
          };

          const validation = this.validateAsset(asset);
          if (!validation.valid) {
            errors.push({
              line: index + 2,
              asset: asset.name,
              error: validation.errors
            });
          } else {
            assets.push(asset);
          }
        } catch (error) {
          errors.push({
            line: index + 2,
            error: error.message
          });
        }
      });

      this.importedSources.push({
        source: 'CSV',
        file: filePath,
        importedAt: new Date(),
        count: assets.length,
        errors: errors.length
      });

      console.log(`  ✓ Imported ${assets.length} assets (${errors.length} errors)`);
      if (errors.length > 0) {
        console.log(`  ⚠️  Validation errors:`, errors.slice(0, 3));
      }

      return assets;
    } catch (error) {
      console.error(`[InventoryManager] CSV import failed:`, error.message);
      return [];
    }
  }

  /**
   * Import from API (simulated)
   */
  importFromAPI(apiEndpoint) {
    console.log(`\n[InventoryManager] Importing from API: ${apiEndpoint}`);

    // Simulated API response
    const assets = [
      {
        name: 'Node.js',
        version: '18.15.0',
        category: 'runtime',
        criticality: 'critical',
        systems: ['Backend-Primary', 'Backend-Secondary'],
        owner: 'Platform Team'
      },
      {
        name: 'React',
        version: '18.2.0',
        category: 'framework',
        criticality: 'high',
        systems: ['Frontend-Web', 'Frontend-Dashboard'],
        owner: 'Frontend Team'
      },
      {
        name: 'PostgreSQL',
        version: '14.5',
        category: 'database',
        criticality: 'critical',
        systems: ['Data-Warehouse'],
        owner: 'DBA Team'
      }
    ];

    this.importedSources.push({
      source: 'API',
      endpoint: apiEndpoint,
      importedAt: new Date(),
      count: assets.length
    });

    console.log(`  ✓ Imported ${assets.length} assets from API`);
    return assets;
  }

  /**
   * Import from JSON file
   */
  importFromJSON(filePath) {
    console.log(`\n[InventoryManager] Importing from JSON: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      const assets = Array.isArray(data) ? data : data.assets || [];

      this.importedSources.push({
        source: 'JSON',
        file: filePath,
        importedAt: new Date(),
        count: assets.length
      });

      console.log(`  ✓ Imported ${assets.length} assets from JSON`);
      return assets;
    } catch (error) {
      console.error(`[InventoryManager] JSON import failed:`, error.message);
      return [];
    }
  }

  /**
   * Validate asset data
   */
  validateAsset(asset) {
    const errors = [];

    if (!asset.name || asset.name.length === 0) {
      errors.push('Name is required');
    }

    if (!asset.version || asset.version.length === 0) {
      errors.push('Version is required');
    }

    const validCategories = ['runtime', 'framework', 'library', 'tool', 'database', 'os', 'middleware'];
    if (asset.category && !validCategories.includes(asset.category)) {
      errors.push(`Invalid category: ${asset.category}`);
    }

    const validCriticalities = ['critical', 'high', 'medium', 'low'];
    if (asset.criticality && !validCriticalities.includes(asset.criticality)) {
      errors.push(`Invalid criticality: ${asset.criticality}`);
    }

    if (!asset.systems || !Array.isArray(asset.systems) || asset.systems.length === 0) {
      errors.push('At least one system is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect duplicates
   */
  detectDuplicates(assets) {
    console.log('\n[InventoryManager] Detecting duplicates...');

    const seen = new Map();

    assets.forEach(asset => {
      const key = `${asset.name}@${asset.version}`;

      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key).push(asset);
    });

    const duplicates = Array.from(seen.entries())
      .filter(([key, list]) => list.length > 1)
      .map(([key, list]) => ({
        key,
        count: list.length,
        assets: list
      }));

    if (duplicates.length > 0) {
      console.log(`  ⚠️  Found ${duplicates.length} duplicate software versions`);
      duplicates.forEach(dup => {
        console.log(`     ${dup.key}: ${dup.count} instances`);
      });
    }

    this.duplicates = new Map(seen);
    return duplicates;
  }

  /**
   * Merge duplicates into single asset with all systems
   */
  mergeDuplicates(assets) {
    console.log('\n[InventoryManager] Merging duplicate assets...');

    const merged = new Map(); // key -> consolidated asset

    assets.forEach(asset => {
      const key = `${asset.name}@${asset.version}`;

      if (!merged.has(key)) {
        merged.set(key, {
          name: asset.name,
          version: asset.version,
          category: asset.category,
          criticality: asset.criticality,
          systems: [],
          owners: new Set()
        });
      }

      const consolidated = merged.get(key);
      asset.systems.forEach(sys => {
        if (!consolidated.systems.includes(sys)) {
          consolidated.systems.push(sys);
        }
      });
      consolidated.owners.add(asset.owner);
    });

    const result = Array.from(merged.values()).map(asset => ({
      ...asset,
      owners: Array.from(asset.owners).join(';'),
      systemCount: asset.systems.length
    }));

    console.log(`  ✓ Merged to ${result.length} unique assets`);
    return result;
  }

  /**
   * Enrich assets with metadata
   */
  enrichAssets(assets) {
    console.log('\n[InventoryManager] Enriching assets with metadata...');

    const eolData = {
      'Node.js': { '16': '2023-09-11', '18': '2025-04-30', '20': '2026-04-30' },
      'Python': { '3.8': '2024-10-14', '3.10': '2026-10-05', '3.11': '2027-10-24', '3.12': '2028-10-02' },
      'Java': { '8': '2030-12-01', '11': '2026-09-01', '17': '2029-09-01', '21': '2031-09-01' },
      'PostgreSQL': { '12': '2024-11-14', '14': '2026-11-12', '15': '2027-10-13' }
    };

    const supportTierMap = {
      'runtime': 'critical',
      'database': 'critical',
      'framework': 'high',
      'middleware': 'high',
      'library': 'medium',
      'tool': 'low'
    };

    const enriched = assets.map(asset => {
      const eolDate = eolData[asset.name]?.[asset.version] || null;
      const daysUntilEOL = eolDate
        ? Math.ceil((new Date(eolDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 365 * 3; // Default 3 years

      return {
        ...asset,
        eolDate,
        daysUntilEOL,
        isEOL: daysUntilEOL < 0,
        supportTier: supportTierMap[asset.category] || 'medium',
        enrichedAt: new Date()
      };
    });

    console.log(`  ✓ Enriched ${enriched.length} assets`);
    return enriched;
  }

  /**
   * Analyze inventory composition
   */
  analyzeComposition(assets) {
    console.log('\n[InventoryManager] Analyzing inventory composition...');

    const analysis = {
      totalAssets: assets.length,
      byCategory: {},
      byCriticality: {},
      eolStatus: {
        current: 0,
        approaching: 0, // < 90 days
        upcoming: 0, // < 180 days
        stable: 0
      },
      systemCoverage: {
        totalSystems: new Set(),
        avgAsetsPerSystem: 0
      },
      riskDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    assets.forEach(asset => {
      // By category
      if (!analysis.byCategory[asset.category]) {
        analysis.byCategory[asset.category] = 0;
      }
      analysis.byCategory[asset.category]++;

      // By criticality
      if (!analysis.byCriticality[asset.criticality]) {
        analysis.byCriticality[asset.criticality] = 0;
      }
      analysis.byCriticality[asset.criticality]++;

      // EOL status
      if (asset.isEOL) analysis.eolStatus.current++;
      else if (asset.daysUntilEOL < 90) analysis.eolStatus.approaching++;
      else if (asset.daysUntilEOL < 180) analysis.eolStatus.upcoming++;
      else analysis.eolStatus.stable++;

      // Systems
      if (asset.systems) {
        asset.systems.forEach(sys => analysis.systemCoverage.totalSystems.add(sys));
      }

      // Risk
      analysis.riskDistribution[asset.criticality || 'medium']++;
    });

    analysis.systemCoverage.totalSystems = analysis.systemCoverage.totalSystems.size;
    if (analysis.systemCoverage.totalSystems > 0) {
      analysis.systemCoverage.avgAsetsPerSystem = 
        (assets.reduce((sum, a) => sum + (a.systems?.length || 0), 0) / analysis.systemCoverage.totalSystems).toFixed(1);
    }

    console.log(`\n  Total Assets: ${analysis.totalAssets}`);
    console.log(`  Categories: ${Object.keys(analysis.byCategory).join(', ')}`);
    console.log(`  Criticality: Critical(${analysis.byCriticality.critical}) High(${analysis.byCriticality.high}) Medium(${analysis.byCriticality.medium}) Low(${analysis.byCriticality.low})`);
    console.log(`  EOL Status: Current(${analysis.eolStatus.current}) Approaching(${analysis.eolStatus.approaching}) Upcoming(${analysis.eolStatus.upcoming}) Stable(${analysis.eolStatus.stable})`);
    console.log(`  Systems: ${analysis.systemCoverage.totalSystems} unique systems`);

    return analysis;
  }

  /**
   * Export enriched inventory
   */
  exportInventory(format = 'json') {
    const assets = Array.from(this.orchestrator.assets.values());

    if (format === 'json') {
      return {
        exportedAt: new Date(),
        assets: assets.map(a => ({
          id: a.id,
          name: a.name,
          version: a.version,
          category: a.category,
          criticality: a.criticality,
          systems: a.systems,
          owner: a.owner
        })),
        summary: this.analyzeComposition(assets)
      };
    } else if (format === 'csv') {
      let csv = 'Name,Version,Category,Criticality,Systems,Owner\n';
      assets.forEach(a => {
        csv += `"${a.name}","${a.version}","${a.category}","${a.criticality}","${a.systems.join(';')}","${a.owner}"\n`;
      });
      return csv;
    }
  }
}

/**
 * Export
 */
module.exports = {
  AssetInventoryManager
};
