import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { blockchainService } from '../services/blockchain';

const router = express.Router();

// Configure multer for audit file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, and XLSX files are allowed.'));
    }
  }
});

// Verify sales file (Auditor only)
router.post('/verify', requireRole('auditor'), upload.single('auditFile'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded for verification' 
      });
    }

    const { storeId, date } = req.body;

    if (!storeId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID and date are required' 
      });
    }

    // Calculate hash of uploaded file
    const uploadedHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Get stored hash from blockchain
    const blockchainResult = await blockchainService.getSalesHash(storeId, date);

    if (!blockchainResult.success) {
      return res.status(404).json({
        success: false,
        message: 'No sales record found for the specified store and date'
      });
    }

    const storedRecord = blockchainResult.data;
    const hashMatch = uploadedHash === storedRecord.hash;

    // Log audit attempt
    const auditLog = {
      auditedBy: req.userAddress,
      storeId,
      date,
      uploadedHash,
      storedHash: storedRecord.hash,
      hashMatch,
      filename: req.file.originalname,
      fileSize: req.file.size,
      timestamp: Date.now(),
      originalSubmission: storedRecord
    };

    const auditLogPath = path.join(
      process.env.STORAGE_PATH || './storage', 
      'audit-logs', 
      `audit_${storeId}_${date}_${Date.now()}.json`
    );
    
    await fs.ensureDir(path.dirname(auditLogPath));
    await fs.writeJson(auditLogPath, auditLog, { spaces: 2 });

    res.json({
      success: true,
      message: hashMatch ? 'File verification successful' : 'File verification failed',
      data: {
        storeId,
        date,
        hashMatch,
        uploadedHash,
        storedHash: storedRecord.hash,
        originalSubmission: {
          submittedBy: storedRecord.submittedBy,
          timestamp: storedRecord.timestamp
        },
        auditDetails: {
          auditedBy: req.userAddress,
          auditTimestamp: auditLog.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Audit verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify file' 
    });
  }
});

// Get audit history (Auditor only)
router.get('/audit-history', requireRole('auditor'), async (req: AuthenticatedRequest, res) => {
  try {
    const auditLogDir = path.join(process.env.STORAGE_PATH || './storage', 'audit-logs');
    
    if (!await fs.pathExists(auditLogDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = await fs.readdir(auditLogDir);
    const auditHistory = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const auditLog = await fs.readJson(path.join(auditLogDir, file));
        if (auditLog.auditedBy === req.userAddress) {
          auditHistory.push(auditLog);
        }
      }
    }

    // Sort by timestamp (newest first)
    auditHistory.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: auditHistory
    });

  } catch (error) {
    console.error('Get audit history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve audit history' 
    });
  }
});

export { router as auditRoutes };