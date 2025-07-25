// Mock blockchain service for development
// In production, this would connect to actual Lisk node

interface BlockchainResponse {
  success: boolean;
  message: string;
  data?: any;
  hasRole?: boolean;
  role?: string;
}

class BlockchainService {
  private mockUsers = new Map<string, string>([
    ['lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu', 'admin'], // Default admin
    ['lsk2a8h3k9j4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b', 'auditor'], // Mock auditor
    ['lsk3b9i4k0j5m6n7p8q9r0s1t2u3v4w5x6y7z8a9c', 'cashier'], // Mock cashier
  ]);

  private mockSalesRecords = new Map<string, any>();

  async submitSalesHash(storeId: string, date: string, hash: string, senderAddress: string): Promise<BlockchainResponse> {
    try {
      // Check if user is cashier
      if (this.mockUsers.get(senderAddress) !== 'cashier') {
        return { success: false, message: 'Unauthorized: Cashier role required' };
      }

      const key = `${storeId}:${date}`;
      if (this.mockSalesRecords.has(key)) {
        return { success: false, message: 'Sales record already exists for this date' };
      }

      this.mockSalesRecords.set(key, {
        storeId,
        date,
        hash,
        timestamp: Date.now(),
        submittedBy: senderAddress
      });

      return { success: true, message: 'Sales hash submitted successfully' };
    } catch (error) {
      return { success: false, message: 'Blockchain submission failed' };
    }
  }

  async getSalesHash(storeId: string, date: string): Promise<BlockchainResponse> {
    try {
      const key = `${storeId}:${date}`;
      const record = this.mockSalesRecords.get(key);

      if (!record) {
        return { success: false, message: 'No sales record found' };
      }

      return { success: true, message: 'Record found', data: record };
    } catch (error) {
      return { success: false, message: 'Blockchain query failed' };
    }
  }

  async addUser(userAddress: string, role: string, senderAddress: string): Promise<BlockchainResponse> {
    try {
      // Check if sender is admin
      if (this.mockUsers.get(senderAddress) !== 'admin') {
        return { success: false, message: 'Unauthorized: Admin role required' };
      }

      this.mockUsers.set(userAddress, role);
      return { success: true, message: `User added to ${role} role successfully` };
    } catch (error) {
      return { success: false, message: 'Failed to add user' };
    }
  }

  async removeUser(userAddress: string, senderAddress: string): Promise<BlockchainResponse> {
    try {
      // Check if sender is admin
      if (this.mockUsers.get(senderAddress) !== 'admin') {
        return { success: false, message: 'Unauthorized: Admin role required' };
      }

      if (this.mockUsers.has(userAddress)) {
        this.mockUsers.delete(userAddress);
        return { success: true, message: 'User removed successfully' };
      }

      return { success: false, message: 'User not found' };
    } catch (error) {
      return { success: false, message: 'Failed to remove user' };
    }
  }

  async hasRole(userAddress: string, role: string): Promise<BlockchainResponse> {
    try {
      const userRole = this.mockUsers.get(userAddress);
      return {
        success: true,
        hasRole: userRole === role,
        role: userRole,
        message: 'Role check completed'
      };
    } catch (error) {
      return { success: false, message: 'Role check failed' };
    }
  }

  async getAllSalesRecords(senderAddress: string): Promise<BlockchainResponse> {
    try {
      // Check if sender is admin
      if (this.mockUsers.get(senderAddress) !== 'admin') {
        return { success: false, message: 'Unauthorized: Admin role required' };
      }

      const records = Array.from(this.mockSalesRecords.values());
      return { success: true, message: 'Records retrieved', data: records };
    } catch (error) {
      return { success: false, message: 'Failed to retrieve records' };
    }
  }

  getAllUsers(): Map<string, string> {
    return new Map(this.mockUsers);
  }
}

export const blockchainService = new BlockchainService();