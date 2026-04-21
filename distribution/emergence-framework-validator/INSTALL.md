# INSTALLATION GUIDE

## System Requirements

- **Node.js:** Version 12.0 or higher
- **Storage:** ~8 KB (including all files)
- **Platform:** Windows, macOS, Linux

## Installation Steps

### Option 1: Windows (Recommended for Windows users)

1. Download and extract `emergence-framework-validator.zip` to your desired location
2. Open Command Prompt (cmd.exe) or PowerShell
3. Navigate to the extracted folder:
   ```
   cd emergence-framework-validator
   ```
4. Run the validator:
   ```
   run.bat
   ```
   Or directly:
   ```
   node validator.cjs
   ```

### Option 2: macOS / Linux (Recommended for Unix users)

1. Download and extract `emergence-framework-validator.zip` (or tar.gz)
2. Open Terminal
3. Navigate to the extracted folder:
   ```bash
   cd emergence-framework-validator
   ```
4. Make the script executable:
   ```bash
   chmod +x run.sh
   ```
5. Run the validator:
   ```bash
   ./run.sh
   ```
   Or directly:
   ```bash
   node validator.cjs
   ```

### Option 3: USB Drive (Portable)

1. Extract the entire `emergence-framework-validator` folder to your USB drive
2. On any computer with Node.js installed:
   - Windows: Double-click `run.bat`
   - macOS/Linux: Run `./run.sh` in terminal
3. Results will be saved to `validation-results.json` on the USB drive

---

## Checking Node.js Installation

### Windows
```
node --version
npm --version
```

### macOS / Linux
```bash
node --version
npm --version
```

If these commands fail, download Node.js from https://nodejs.org/

---

## Running the Validator

### Basic Run
```
node validator.js
```

### Verbose Output (Detailed Results)
```
node validator.js --verbose
node validator.js -v
```

### Expected Output
- Test results for all 10 candidates
- Pass/fail status for each
- Summary statistics
- Tier breakdown confirmation
- Results saved to `validation-results.json`

---

## Troubleshooting

### "node: command not found"
- Node.js is not installed or not in your system PATH
- Install from https://nodejs.org/
- Restart terminal/command prompt after installation

### "Permission denied" (macOS/Linux)
- Run: `chmod +x run.sh` first
- Then: `./run.sh`

### Script hangs or takes too long
- This should complete in < 1 second
- Check system resources
- Try running `node validator.js` directly instead of through wrapper scripts

### Results file not created
- Ensure you have write permissions in the folder
- Check that validation actually completed (no errors above)
- Try: `node validator.js > output.txt 2>&1`

---

## Next Steps After Installation

1. Run the validator to confirm it works
2. Review `validation-results.json` output
3. Read [README.md](README.md) for interpretation guide
4. Compare results against published documentation
5. Submit findings for peer review if running independently

---

## Support

This is a standalone validator package intended for external peer review.

For questions about:
- **Installation/technical issues:** See Troubleshooting above
- **Interpretation of results:** See README.md
- **Framework details:** See EMERGENCE-FRAMEWORK-2.0-COMPLETE-SUMMARY.md
- **Full methodology:** See Phase 17-41 documentation in parent directory

---

**Version:** 1.0  
**Date:** April 19, 2026  
**Status:** Ready for external validation
