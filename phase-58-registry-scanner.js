/**
 * Phase 58: Windows Registry Scanner for Software Lifecycle Management
 * 
 * Reads Windows registry to extract installed software metadata:
 * - Software names and versions
 * - Installation dates
 * - Vendor information
 * - Architecture (32-bit, 64-bit)
 * - Registry keys and uninstall data
 * 
 * Works on Windows platform using native registry access
 */

const { execSync } = require('child_process');
const EventEmitter = require('events');
const path = require('path');

/**
 * WindowsRegistryScanner: Read Windows registry for installed software
 */
class WindowsRegistryScanner extends EventEmitter {
  constructor() {
    super();
    this.installedSoftware = [];
    this.registryPaths = {
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall': 'System (64-bit)',
      'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall': 'System (32-bit)',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall': 'User (64-bit)',
      'HKCU\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall': 'User (32-bit)'
    };
  }

  /**
   * Scan Windows registry for installed software
   */
  async scanRegistry() {
    console.log('Starting Windows registry scan for installed software...');
    this.installedSoftware = [];

    for (const [regPath, category] of Object.entries(this.registryPaths)) {
      console.log(`  Scanning: ${category} (${regPath})`);
      
      try {
        const softwareList = this.queryRegistry(regPath, category);
        this.installedSoftware.push(...softwareList);
      } catch (error) {
        console.warn(`  Warning scanning ${category}: ${error.message}`);
        this.emit('registry-scan-error', { path: regPath, error });
      }
    }

    console.log(`Found ${this.installedSoftware.length} installed software entries`);
    this.emit('registry-scan-complete', { count: this.installedSoftware.length });
    return this.installedSoftware;
  }

  /**
   * Query specific registry path using PowerShell
   */
  queryRegistry(regPath, category) {
    const software = [];
    
    try {
      // PowerShell command to query registry
      const psCommand = `
        $regPath = '${regPath.replace(/\\/g, '\\\\')}'
        $items = @()
        
        try {
          if (Test-Path "Registry::$regPath") {
            $keys = Get-ChildItem -Path "Registry::$regPath" -ErrorAction SilentlyContinue
            
            foreach ($key in $keys) {
              $props = Get-ItemProperty -Path "Registry::$($key.PSPath)" -ErrorAction SilentlyContinue
              
              if ($props.DisplayName) {
                $item = @{
                  Name = $props.DisplayName
                  Version = $props.DisplayVersion
                  Publisher = $props.Publisher
                  InstallDate = $props.InstallDate
                  UninstallString = $props.UninstallString
                  RegistryKey = $key.PSChildName
                  SystemComponent = if ($props.SystemComponent) { $props.SystemComponent } else { 0 }
                  Size = if ($props.EstimatedSize) { $props.EstimatedSize * 1024 } else { 0 }
                }
                $items += $item
              }
            }
          }
        } catch {
          Write-Error $_.Exception.Message
        }
        
        $items | ConvertTo-Json -Depth 3
      `;

      // Execute PowerShell command
      const result = execSync(`powershell -NoProfile -Command "${psCommand.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      if (result && result.trim()) {
        try {
          const parsed = JSON.parse(result);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          
          for (const item of items) {
            software.push({
              name: item.Name || 'Unknown',
              version: item.Version || 'Unknown',
              publisher: item.Publisher || 'Unknown Publisher',
              installDate: this.parseInstallDate(item.InstallDate),
              category: category,
              registryKey: item.RegistryKey || '',
              systemComponent: item.SystemComponent === 1,
              size: item.Size || 0,
              uninstallString: item.UninstallString || '',
              detected: new Date().toISOString()
            });
          }
        } catch (parseError) {
          console.warn(`  Parse error for ${category}: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.warn(`  Registry query error for ${category}: ${error.message}`);
    }

    return software;
  }

  /**
   * Parse Windows install date format (YYYYMMDD)
   */
  parseInstallDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    // Try to parse YYYYMMDD format
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      try {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        
        const date = new Date(year, month, day);
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * Get software by name (case-insensitive search)
   */
  getSoftwareByName(name) {
    const lowerName = name.toLowerCase();
    return this.installedSoftware.filter(s =>
      s.name.toLowerCase().includes(lowerName) ||
      s.publisher.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Get all runtime environments (Node.js, Python, Java, .NET)
   */
  getRuntimeEnvironments() {
    const runtimes = [];
    const runtimePatterns = {
      'Node.js': /node\.?js|nodejs/i,
      'Python': /python/i,
      'Java': /java|jdk|jre/i,
      '.NET': /\.net|microsoft\..*\.framework|dotnet/i,
      'Ruby': /ruby/i,
      'PHP': /php/i,
      'Go': /golang|go programming/i,
      'Rust': /rust/i
    };

    for (const software of this.installedSoftware) {
      for (const [runtimeName, pattern] of Object.entries(runtimePatterns)) {
        if (pattern.test(software.name) || pattern.test(software.publisher)) {
          runtimes.push({
            ...software,
            runtimeType: runtimeName
          });
          break;
        }
      }
    }

    return runtimes;
  }

  /**
   * Get all security software
   */
  getSecuritySoftware() {
    const securityPatterns = /antivirus|firewall|malware|defender|security|norton|mcafee|kaspersky|trend micro|bitdefender|avast/i;
    return this.installedSoftware.filter(s =>
      securityPatterns.test(s.name) || securityPatterns.test(s.publisher)
    );
  }

  /**
   * Get development tools
   */
  getDevelopmentTools() {
    const devPatterns = /visual studio|git|cmake|docker|npm|vscode|intellij|android studio|xcode|compiler|sdk/i;
    return this.installedSoftware.filter(s =>
      devPatterns.test(s.name) || devPatterns.test(s.publisher)
    );
  }

  /**
   * Export software inventory as JSON
   */
  exportInventory() {
    return {
      scanTime: new Date().toISOString(),
      totalSoftware: this.installedSoftware.length,
      runtimes: this.getRuntimeEnvironments().length,
      security: this.getSecuritySoftware().length,
      development: this.getDevelopmentTools().length,
      software: this.installedSoftware.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  /**
   * Get statistical summary
   */
  getSummary() {
    const byCategory = {};
    const byPublisher = {};
    let totalSize = 0;

    for (const software of this.installedSoftware) {
      // By category
      if (!byCategory[software.category]) {
        byCategory[software.category] = 0;
      }
      byCategory[software.category]++;

      // By publisher
      if (!byPublisher[software.publisher]) {
        byPublisher[software.publisher] = 0;
      }
      byPublisher[software.publisher]++;

      // Total size
      totalSize += software.size || 0;
    }

    return {
      totalSoftware: this.installedSoftware.length,
      totalSize: totalSize,
      byCategory,
      topPublishers: Object.entries(byPublisher)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ publisher: name, count }))
    };
  }
}

/**
 * RegistryScannerAgent: Autonomous registry scanning agent
 */
class RegistryScannerAgent extends EventEmitter {
  constructor() {
    super();
    this.scanner = new WindowsRegistryScanner();
    this.scanHistory = [];
    this.scanInterval = null;
    this.isRunning = false;
  }

  /**
   * Start continuous scanning
   */
  async startContinuousScanning(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log('Scanning already in progress');
      return;
    }

    this.isRunning = true;
    console.log(`Starting continuous registry scanning every ${intervalMinutes} minutes`);

    // Initial scan
    await this.performScan();

    // Schedule recurring scans
    this.scanInterval = setInterval(() => {
      this.performScan().catch(error => {
        console.error('Scan error:', error);
        this.emit('scan-error', error);
      });
    }, intervalMinutes * 60 * 1000);

    this.emit('scanning-started');
  }

  /**
   * Stop continuous scanning
   */
  stopContinuousScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      this.isRunning = false;
      console.log('Continuous scanning stopped');
      this.emit('scanning-stopped');
    }
  }

  /**
   * Perform a single scan
   */
  async performScan() {
    console.log('Performing registry scan...');
    const startTime = Date.now();

    try {
      const software = await this.scanner.scanRegistry();
      
      const scanResult = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        softwareCount: software.length,
        software: software,
        summary: this.scanner.getSummary()
      };

      this.scanHistory.push(scanResult);
      
      // Keep only last 30 scans
      if (this.scanHistory.length > 30) {
        this.scanHistory.shift();
      }

      this.emit('scan-complete', scanResult);
      return scanResult;
    } catch (error) {
      console.error('Scan failed:', error);
      this.emit('scan-failed', error);
      throw error;
    }
  }

  /**
   * Get scan history
   */
  getScanHistory(limit = 10) {
    return this.scanHistory.slice(-limit);
  }

  /**
   * Get latest scan
   */
  getLatestScan() {
    return this.scanHistory.length > 0 ? this.scanHistory[this.scanHistory.length - 1] : null;
  }

  /**
   * Compare two scans to find new, removed, or updated software
   */
  compareScanResults(oldScan, newScan) {
    const oldSoftware = new Map(oldScan.software.map(s => [s.name, s]));
    const newSoftware = new Map(newScan.software.map(s => [s.name, s]));

    const added = [];
    const removed = [];
    const updated = [];

    // Find added and updated
    for (const [name, newSoft] of newSoftware) {
      if (!oldSoftware.has(name)) {
        added.push(newSoft);
      } else {
        const oldSoft = oldSoftware.get(name);
        if (oldSoft.version !== newSoft.version) {
          updated.push({
            name,
            oldVersion: oldSoft.version,
            newVersion: newSoft.version
          });
        }
      }
    }

    // Find removed
    for (const [name, oldSoft] of oldSoftware) {
      if (!newSoftware.has(name)) {
        removed.push(oldSoft);
      }
    }

    return { added, removed, updated };
  }
}

/**
 * Export
 */
module.exports = {
  WindowsRegistryScanner,
  RegistryScannerAgent
};
