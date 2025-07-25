import { Request, Response, NextFunction } from 'express';
import { blockchainService } from '../services/blockchain';

export interface AuthenticatedRequest extends Request {
  userAddress?: string;
  userRole?: string;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get wallet address from header
    const walletAddress = req.headers['x-wallet-address'] as string;
    
    if (!walletAddress) {
      return res.status(401).json({ 
        success: false, 
        message: 'Wallet address required' 
      });
    }

    // Validate address format (basic validation)
    if (!walletAddress.startsWith('lsk') || walletAddress.length !== 41) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid wallet address format' 
      });
    }

    // Check user role on blockchain
    const roleCheck = await blockchainService.hasRole(walletAddress, 'admin');
    if (roleCheck.success && roleCheck.hasRole) {
      req.userAddress = walletAddress;
      req.userRole = 'admin';
      return next();
    }

    const auditorCheck = await blockchainService.hasRole(walletAddress, 'auditor');
    if (auditorCheck.success && auditorCheck.hasRole) {
      req.userAddress = walletAddress;
      req.userRole = 'auditor';
      return next();
    }

    const cashierCheck = await blockchainService.hasRole(walletAddress, 'cashier');
    if (cashierCheck.success && cashierCheck.hasRole) {
      req.userAddress = walletAddress;
      req.userRole = 'cashier';
      return next();
    }

    // If no role found, deny access
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: No valid role assigned' 
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.userRole !== requiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Unauthorized: ${requiredRole} role required` 
      });
    }
    next();
  };
};