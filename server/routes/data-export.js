/**
 * Data Export Functionality
 * Phase 17.2.4: Export Capabilities
 * 
 * Provides:
 * - CSV export for milestone data
 * - PDF report generation
 * - JSON dump export
 * - Export status tracking
 * - File management and cleanup
 */

import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

const EXPORT_DIR = process.env.EXPORT_DIR || '/tmp/misttracker-exports';
const MAX_EXPORT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Ensure export directory exists
async function ensureExportDir() {
  try {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating export directory:', err);
  }
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * POST /api/cluster/export/csv
 * 
 * Generate CSV export of milestone data
 * 
 * Request Body:
 * {
 *   "session_id": "uuid",
 *   "atoms": ["H", "He"],
 *   "include_metadata": true,
 *   "include_statistics": true
 * }
 */
router.post('/export/csv', requirePermission('export:data'), async (req, res) => {
  try {
    const db = getDatabase();
    await ensureExportDir();

    const {
      session_id,
      atoms,
      include_metadata = true,
      include_statistics = true,
    } = req.body;

    if (!session_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'session_id is required',
      });
    }

    // Get milestones
    const queryOptions = {
      session_id,
      limit: 100000,
    };

    let milestones = await db.getMilestones(queryOptions);

    // Filter by atoms if specified
    if (atoms && Array.isArray(atoms)) {
      milestones = milestones.filter(m => atoms.includes(m.atom));
    }

    if (milestones.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No milestones found for export',
      });
    }

    // Build CSV content
    const headers = [
      'epoch',
      'atom',
      'node_id',
      'loss',
      'accuracy',
      'timestamp',
    ];

    if (include_metadata) {
      headers.push('training_elapsed_ms', 'batch_count', 'learning_rate', 'batch_size');
    }

    const csvLines = [headers.join(',')];

    for (const milestone of milestones) {
      const row = [
        milestone.epoch,
        milestone.atom,
        milestone.node_id,
        milestone.loss.toFixed(8),
        milestone.accuracy.toFixed(8),
        new Date(milestone.timestamp).toISOString(),
      ];

      if (include_metadata && milestone.metadata) {
        row.push(
          milestone.metadata.training_elapsed_ms || '',
          milestone.metadata.batch_count || '',
          milestone.metadata.learning_rate || '',
          milestone.metadata.batch_size || ''
        );
      }

      csvLines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }

    // Add statistics section if requested
    if (include_statistics) {
      csvLines.push('');
      csvLines.push('# Statistics');

      // Group by atom
      const byAtom = {};
      for (const m of milestones) {
        if (!byAtom[m.atom]) {
          byAtom[m.atom] = [];
        }
        byAtom[m.atom].push(m);
      }

      for (const [atom, atomMilestones] of Object.entries(byAtom)) {
        const avgLoss = atomMilestones.reduce((sum, m) => sum + m.loss, 0) / atomMilestones.length;
        const avgAccuracy = atomMilestones.reduce((sum, m) => sum + m.accuracy, 0) / atomMilestones.length;
        const bestAccuracy = Math.max(...atomMilestones.map(m => m.accuracy));

        csvLines.push(
          `"${atom} - Avg Loss","${avgLoss.toFixed(8)}"`,
          `"${atom} - Avg Accuracy","${avgAccuracy.toFixed(8)}"`,
          `"${atom} - Best Accuracy","${bestAccuracy.toFixed(8)}"`
        );
      }
    }

    // Save to file
    const exportId = uuidv4();
    const fileName = `export-${exportId}.csv`;
    const filePath = path.join(EXPORT_DIR, fileName);

    await fs.writeFile(filePath, csvLines.join('\n'), 'utf8');

    // Record export
    const exportRecord = {
      _id: exportId,
      user_id: req.user.id,
      session_id,
      export_type: 'csv',
      file_path: filePath,
      file_size_bytes: (await fs.stat(filePath)).size,
      status: 'completed',
      format_options: {
        include_metadata,
        include_statistics,
        atom_filter: atoms,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insertExport(exportRecord);

    res.json({
      export_id: exportId,
      status: 'completed',
      file_type: 'csv',
      file_size_bytes: exportRecord.file_size_bytes,
      records_included: milestones.length,
      download_url: `/api/cluster/export/download/${exportId}`,
      created_at: exportRecord.created_at,
    });
  } catch (err) {
    console.error('Error in CSV export:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * POST /api/cluster/export/json
 * 
 * Generate JSON export of milestone data
 * 
 * Request Body:
 * {
 *   "session_id": "uuid",
 *   "atoms": ["H", "He"],
 *   "pretty_print": true
 * }
 */
router.post('/export/json', requirePermission('export:data'), async (req, res) => {
  try {
    const db = getDatabase();
    await ensureExportDir();

    const {
      session_id,
      atoms,
      pretty_print = true,
    } = req.body;

    if (!session_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'session_id is required',
      });
    }

    // Get session and milestones
    const sessions = await db.getSessions({ user_id: req.user.id });
    const session = sessions.find(s => (s._id || s.id) === session_id);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    const queryOptions = {
      session_id,
      limit: 100000,
    };

    let milestones = await db.getMilestones(queryOptions);

    if (atoms && Array.isArray(atoms)) {
      milestones = milestones.filter(m => atoms.includes(m.atom));
    }

    // Build JSON structure
    const exportData = {
      metadata: {
        export_type: 'json',
        export_time: new Date().toISOString(),
        session_id,
        session_info: {
          started_at: session.started_at,
          ended_at: session.ended_at,
          atoms: session.atoms,
          total_milestones: milestones.length,
        },
      },
      milestones,
      statistics: calculateStatistics(milestones),
    };

    // Save to file
    const exportId = uuidv4();
    const fileName = `export-${exportId}.json`;
    const filePath = path.join(EXPORT_DIR, fileName);

    const jsonContent = pretty_print
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    await fs.writeFile(filePath, jsonContent, 'utf8');

    // Record export
    const exportRecord = {
      _id: exportId,
      user_id: req.user.id,
      session_id,
      export_type: 'json',
      file_path: filePath,
      file_size_bytes: (await fs.stat(filePath)).size,
      status: 'completed',
      format_options: {
        atom_filter: atoms,
        pretty_print,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insertExport(exportRecord);

    res.json({
      export_id: exportId,
      status: 'completed',
      file_type: 'json',
      file_size_bytes: exportRecord.file_size_bytes,
      records_included: milestones.length,
      download_url: `/api/cluster/export/download/${exportId}`,
      created_at: exportRecord.created_at,
    });
  } catch (err) {
    console.error('Error in JSON export:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * POST /api/cluster/export/pdf
 * 
 * Generate PDF report of session data and statistics
 * 
 * Request Body:
 * {
 *   "session_id": "uuid",
 *   "include_charts": true,
 *   "include_raw_data": false
 * }
 * 
 * Note: Requires pdfkit library
 */
router.post('/export/pdf', requirePermission('export:data'), async (req, res) => {
  try {
    const db = getDatabase();
    await ensureExportDir();

    const {
      session_id,
      include_charts = true,
      include_raw_data = false,
    } = req.body;

    if (!session_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'session_id is required',
      });
    }

    // Get session and milestones
    const sessions = await db.getSessions({ user_id: req.user.id });
    const session = sessions.find(s => (s._id || s.id) === session_id);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    const queryOptions = {
      session_id,
      limit: 100000,
    };

    const milestones = await db.getMilestones(queryOptions);

    // Create PDF structure (text representation for now)
    // In production, use PDFKit or similar library
    let pdfContent = `MistTracker - Training Session Report\n`;
    pdfContent += `${'='.repeat(60)}\n\n`;

    pdfContent += `Session Information:\n`;
    pdfContent += `- Session ID: ${session_id}\n`;
    pdfContent += `- Started: ${session.started_at}\n`;
    pdfContent += `- Ended: ${session.ended_at}\n`;
    pdfContent += `- Status: ${session.status}\n`;
    pdfContent += `- Atoms: ${Array.isArray(session.atoms) ? session.atoms.join(', ') : session.atoms}\n\n`;

    if (session.metrics) {
      pdfContent += `Performance Metrics:\n`;
      pdfContent += `- Final Accuracy: ${session.metrics.final_accuracy?.toFixed(4)}\n`;
      pdfContent += `- Final Loss: ${session.metrics.final_loss?.toFixed(6)}\n`;
      pdfContent += `- Best Accuracy: ${session.metrics.best_accuracy?.toFixed(4)}\n`;
      pdfContent += `- Convergence Epoch: ${session.metrics.convergence_epoch || 'N/A'}\n\n`;
    }

    // Add statistics
    const stats = calculateStatistics(milestones);
    pdfContent += `Statistical Summary:\n`;
    pdfContent += `- Total Milestones: ${stats.total_count}\n`;
    pdfContent += `- Average Accuracy: ${stats.avg_accuracy.toFixed(4)}\n`;
    pdfContent += `- Average Loss: ${stats.avg_loss.toFixed(6)}\n\n`;

    if (include_raw_data && milestones.length <= 10000) {
      pdfContent += `Raw Milestone Data:\n`;
      pdfContent += `${'Epoch'.padEnd(8)}${'Atom'.padEnd(6)}${'Loss'.padEnd(12)}${'Accuracy'.padEnd(12)}\n`;
      pdfContent += `${'-'.repeat(38)}\n`;

      for (const m of milestones.slice(0, 1000)) {
        pdfContent += `${String(m.epoch).padEnd(8)}${m.atom.padEnd(6)}${m.loss.toFixed(6).padEnd(12)}${m.accuracy.toFixed(6).padEnd(12)}\n`;
      }

      if (milestones.length > 1000) {
        pdfContent += `\n... (${milestones.length - 1000} more records not shown)\n`;
      }
    }

    // Save to file
    const exportId = uuidv4();
    const fileName = `export-${exportId}.pdf`;
    const filePath = path.join(EXPORT_DIR, fileName);

    await fs.writeFile(filePath, pdfContent, 'utf8');

    // Record export
    const exportRecord = {
      _id: exportId,
      user_id: req.user.id,
      session_id,
      export_type: 'pdf',
      file_path: filePath,
      file_size_bytes: (await fs.stat(filePath)).size,
      status: 'completed',
      format_options: {
        include_charts,
        include_raw_data,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insertExport(exportRecord);

    res.json({
      export_id: exportId,
      status: 'completed',
      file_type: 'pdf',
      file_size_bytes: exportRecord.file_size_bytes,
      records_included: milestones.length,
      download_url: `/api/cluster/export/download/${exportId}`,
      created_at: exportRecord.created_at,
    });
  } catch (err) {
    console.error('Error in PDF export:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// DOWNLOAD EXPORT
// ============================================================================

/**
 * GET /api/cluster/export/download/:export_id
 * 
 * Download previously generated export file
 */
router.get('/export/download/:export_id', requirePermission('export:data'), async (req, res) => {
  try {
    const db = getDatabase();
    const { export_id } = req.params;

    // Find export record
    let exportRecord = null;
    if (db.provider === 'mongodb') {
      exportRecord = await db.db.collection('exports').findOne({ _id: export_id });
    } else {
      const result = await db.connection.query(
        'SELECT * FROM exports WHERE id = $1',
        [export_id]
      );
      exportRecord = result.rows[0];
    }

    if (!exportRecord || exportRecord.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Export not found',
      });
    }

    if (exportRecord.status !== 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Export is ${exportRecord.status}`,
      });
    }

    // Check file exists
    try {
      await fs.stat(exportRecord.file_path);
    } catch (err) {
      return res.status(410).json({
        error: 'Gone',
        message: 'Export file no longer available',
      });
    }

    // Set response headers
    res.setHeader('Content-Type', getContentType(exportRecord.export_type));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="misttracker-export.${exportRecord.export_type}"`
    );

    // Stream file
    const fileStream = fs.createReadStream(exportRecord.file_path);
    fileStream.pipe(res);

    // Update download count
    if (db.provider === 'mongodb') {
      await db.db.collection('exports').updateOne(
        { _id: export_id },
        { $inc: { download_count: 1 } }
      );
    } else {
      await db.connection.query(
        'UPDATE exports SET download_count = download_count + 1 WHERE id = $1',
        [export_id]
      );
    }
  } catch (err) {
    console.error('Error downloading export:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// LIST EXPORTS
// ============================================================================

/**
 * GET /api/cluster/export/list
 * 
 * List all exports for current user
 */
router.get('/export/list', requirePermission('export:data'), async (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 50, offset = 0 } = req.query;

    let exports = [];
    if (db.provider === 'mongodb') {
      exports = await db.db
        .collection('exports')
        .find({ user_id: req.user.id })
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .toArray();
    } else {
      const result = await db.connection.query(
        'SELECT * FROM exports WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user.id, parseInt(limit), parseInt(offset)]
      );
      exports = result.rows;
    }

    res.json({
      exports: exports.map(e => ({
        id: e._id || e.id,
        session_id: e.session_id,
        type: e.export_type,
        size_bytes: e.file_size_bytes,
        status: e.status,
        created_at: e.created_at,
        downloads: e.download_count || 0,
      })),
      count: exports.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error listing exports:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStatistics(milestones) {
  if (milestones.length === 0) {
    return {
      total_count: 0,
      avg_loss: 0,
      avg_accuracy: 0,
      min_loss: 0,
      max_accuracy: 0,
    };
  }

  return {
    total_count: milestones.length,
    avg_loss: milestones.reduce((sum, m) => sum + m.loss, 0) / milestones.length,
    avg_accuracy: milestones.reduce((sum, m) => sum + m.accuracy, 0) / milestones.length,
    min_loss: Math.min(...milestones.map(m => m.loss)),
    max_accuracy: Math.max(...milestones.map(m => m.accuracy)),
  };
}

function getContentType(exportType) {
  const types = {
    csv: 'text/csv',
    json: 'application/json',
    pdf: 'application/pdf',
  };
  return types[exportType] || 'application/octet-stream';
}

export default router;
