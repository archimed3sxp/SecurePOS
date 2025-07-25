import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { blockchainService } from '../services/blockchain';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.STORAGE_PATH || './storage', 'sales');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, and XLSX files are allowed.'));
    }
  }
});

// Submit sales file (Cashier only)
router.post('/submit-sales', requireRole('cashier'), upload.single('salesFile'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { storeId, date } = req.body;

    if (!storeId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID and date are required' 
      });
    }

    // Read file and calculate hash
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Submit hash to blockchain
    const blockchainResult = await blockchainService.submitSalesHash(
      storeId, 
      date, 
      hash, 
      req.userAddress!
    );

    if (!blockchainResult.success) {
      // Clean up uploaded file if blockchain submission fails
      await fs.remove(req.file.path);
      return res.status(400).json(blockchainResult);
    }

    // Store metadata
    const metadata = {
      storeId,
      date,
      hash,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      submittedBy: req.userAddress,
      timestamp: Date.now()
    };

    const metadataPath = path.join(
      process.env.STORAGE_PATH || './storage', 
      'metadata', 
      `${storeId}_${date}.json`
    );
    
    await fs.ensureDir(path.dirname(metadataPath));
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    res.json({
      success: true,
      message: 'Sales file submitted successfully',
      data: {
        storeId,
        date,
        hash,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Sales submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit sales file' 
    });
  }
});

// Get submission history (Cashier only)
router.get('/submissions', requireRole('cashier'), async (req: AuthenticatedRequest, res) => {
  try {
    const metadataDir = path.join(process.env.STORAGE_PATH || './storage', 'metadata');
    
    if (!await fs.pathExists(metadataDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = await fs.readdir(metadataDir);
    const submissions = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const metadata = await fs.readJson(path.join(metadataDir, file));
        if (metadata.submittedBy === req.userAddress) {
          submissions.push(metadata);
        }
      }
    }

    // Sort by timestamp (newest first)
    submissions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve submissions' 
    });
  }
});

export { router as salesRoutes };