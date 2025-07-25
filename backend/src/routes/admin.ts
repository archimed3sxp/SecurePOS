import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { blockchainService } from '../services/blockchain';

const router = express.Router();

// Add user to role (Admin only)
router.post('/add-user', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userAddress, role } = req.body;

    if (!userAddress || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'User address and role are required' 
      });
    }

    if (!['admin', 'auditor', 'cashier'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be admin, auditor, or cashier' 
      });
    }

    // Validate address format
    if (!userAddress.startsWith('lsk') || userAddress.length !== 41) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Lisk address format' 
      });
    }

    const result = await blockchainService.addUser(userAddress, role, req.userAddress!);

    if (result.success) {
      // Log admin action
      const adminLog = {
        action: 'add_user',
        adminAddress: req.userAddress,
        targetAddress: userAddress,
        role,
        timestamp: Date.now()
      };

      const logPath = path.join(
        process.env.STORAGE_PATH || './storage', 
        'admin-logs', 
        `admin_${Date.now()}.json`
      );
      
      await fs.ensureDir(path.dirname(logPath));
      await fs.writeJson(logPath, adminLog, { spaces: 2 });
    }

    res.json(result);

  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add user' 
    });
  }
});

// Remove user from role (Admin only)
router.delete('/remove-user', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'User address is required' 
      });
    }

    const result = await blockchainService.removeUser(userAddress, req.userAddress!);

    if (result.success) {
      // Log admin action
      const adminLog = {
        action: 'remove_user',
        adminAddress: req.userAddress,
        targetAddress: userAddress,
        timestamp: Date.now()
      };

      const logPath = path.join(
        process.env.STORAGE_PATH || './storage', 
        'admin-logs', 
        `admin_${Date.now()}.json`
      );
      
      await fs.ensureDir(path.dirname(logPath));
      await fs.writeJson(logPath, adminLog, { spaces: 2 });
    }

    res.json(result);

  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove user' 
    });
  }
});

// Get all users (Admin only)
router.get('/users', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = blockchainService.getAllUsers();
    const userList = Array.from(users.entries()).map(([address, role]) => ({
      address,
      role
    }));

    res.json({
      success: true,
      data: userList
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve users' 
    });
  }
});

// Get all activity logs (Admin only)
router.get('/logs', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const logs = {
      salesSubmissions: [],
      auditLogs: [],
      adminActions: []
    };

    const storageBase = process.env.STORAGE_PATH || './storage';

    // Get sales submissions
    const metadataDir = path.join(storageBase, 'metadata');
    if (await fs.pathExists(metadataDir)) {
      const metadataFiles = await fs.readdir(metadataDir);
      for (const file of metadataFiles) {
        if (file.endsWith('.json')) {
          const metadata = await fs.readJson(path.join(metadataDir, file));
          logs.salesSubmissions.push(metadata);
        }
      }
    }

    // Get audit logs
    const auditLogDir = path.join(storageBase, 'audit-logs');
    if (await fs.pathExists(auditLogDir)) {
      const auditFiles = await fs.readdir(auditLogDir);
      for (const file of auditFiles) {
        if (file.endsWith('.json')) {
          const auditLog = await fs.readJson(path.join(auditLogDir, file));
          logs.auditLogs.push(auditLog);
        }
      }
    }

    // Get admin actions
    const adminLogDir = path.join(storageBase, 'admin-logs');
    if (await fs.pathExists(adminLogDir)) {
      const adminFiles = await fs.readdir(adminLogDir);
      for (const file of adminFiles) {
        if (file.endsWith('.json')) {
          const adminLog = await fs.readJson(path.join(adminLogDir, file));
          logs.adminActions.push(adminLog);
        }
      }
    }

    // Sort all logs by timestamp
    logs.salesSubmissions.sort((a, b) => b.timestamp - a.timestamp);
    logs.auditLogs.sort((a, b) => b.timestamp - a.timestamp);
    logs.adminActions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve logs' 
    });
  }
});

// Get system statistics (Admin only)
router.get('/stats', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = blockchainService.getAllUsers();
    const userStats = {
      total: users.size,
      admins: 0,
      auditors: 0,
      cashiers: 0
    };

    for (const [, role] of users) {
      userStats[`${role}s` as keyof typeof userStats]++;
    }

    // Get blockchain records
    const blockchainResult = await blockchainService.getAllSalesRecords(req.userAddress!);
    const salesRecords = blockchainResult.success ? blockchainResult.data : [];

    const stats = {
      users: userStats,
      salesRecords: {
        total: salesRecords.length,
        thisMonth: salesRecords.filter((record: any) => {
          const recordDate = new Date(record.timestamp);
          const now = new Date();
          return recordDate.getMonth() === now.getMonth() && 
                 recordDate.getFullYear() === now.getFullYear();
        }).length
      },
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        lastUpdate: Date.now()
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve statistics' 
    });
  }
});

export { router as adminRoutes };