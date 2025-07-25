import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { salesRoutes } from './routes/sales';
import { adminRoutes } from './routes/admin';
import { auditRoutes } from './routes/audit';
import { authMiddleware } from './middleware/auth';
import { ensureStorageDirectory } from './utils/storage';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure storage directory exists
ensureStorageDirectory();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SecurePOS Backend'
  });
});

// Routes
app.use('/api', authMiddleware, salesRoutes);
app.use('/api', authMiddleware, auditRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SecurePOS Backend running on port ${PORT}`);
  console.log(`📁 Storage directory: ${process.env.STORAGE_PATH}`);
  console.log(`🔐 Admin address: ${process.env.ADMIN_ADDRESS}`);
});

export default app;