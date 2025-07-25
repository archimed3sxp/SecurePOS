import fs from 'fs-extra';
import path from 'path';

export const ensureStorageDirectory = async () => {
  const storageBase = process.env.STORAGE_PATH || './storage';
  
  const directories = [
    storageBase,
    path.join(storageBase, 'sales'),
    path.join(storageBase, 'metadata'),
    path.join(storageBase, 'audit-logs'),
    path.join(storageBase, 'admin-logs')
  ];

  for (const dir of directories) {
    await fs.ensureDir(dir);
  }

  console.log(`📁 Storage directories initialized at: ${storageBase}`);
};

export const getStoragePath = (subPath: string): string => {
  const storageBase = process.env.STORAGE_PATH || './storage';
  return path.join(storageBase, subPath);
};

export const cleanupOldFiles = async (directory: string, maxAgeMs: number) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.remove(filePath);
        console.log(`🗑️ Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};