import {
  BaseModule,
  ModuleInitArgs,
  ModuleMetadata,
  InsertAssetContext,
  BlockExecuteContext,
  TransactionExecuteContext,
  VerifyStatus,
  GenesisBlockExecuteContext,
} from 'lisk-sdk';

export interface SalesRecord {
  storeId: string;
  date: string;
  hash: string;
  timestamp: number;
  submittedBy: string;
}

export interface UserRole {
  address: string;
  role: 'admin' | 'auditor' | 'cashier';
  addedBy: string;
  timestamp: number;
}

export class SecurePOSModule extends BaseModule {
  public name = 'securepos';
  public id = 1000;

  // Store sales records: key = storeId:date, value = SalesRecord
  private salesRecords = new Map<string, SalesRecord>();
  
  // Store user roles: key = address, value = UserRole
  private userRoles = new Map<string, UserRole>();
  
  // Admin addresses (deployer is default admin)
  private adminAddresses = new Set<string>();

  public constructor() {
    super();
  }

  public async init(args: ModuleInitArgs): Promise<void> {
    // Initialize with deployer as admin
    const deployerAddress = args.genesisConfig.accounts[0]?.address;
    if (deployerAddress) {
      this.adminAddresses.add(deployerAddress);
      this.userRoles.set(deployerAddress, {
        address: deployerAddress,
        role: 'admin',
        addedBy: deployerAddress,
        timestamp: Date.now()
      });
    }
  }

  public metadata(): ModuleMetadata {
    return {
      endpoints: [
        {
          name: 'submitSalesHash',
          handler: this.submitSalesHash.bind(this),
        },
        {
          name: 'getSalesHash',
          handler: this.getSalesHash.bind(this),
        },
        {
          name: 'addUser',
          handler: this.addUser.bind(this),
        },
        {
          name: 'removeUser',
          handler: this.removeUser.bind(this),
        },
        {
          name: 'hasRole',
          handler: this.hasRole.bind(this),
        },
        {
          name: 'getAllSalesRecords',
          handler: this.getAllSalesRecords.bind(this),
        },
      ],
      assets: [],
      stores: [],
    };
  }

  // Submit sales hash (Cashier only)
  public async submitSalesHash(context: any): Promise<{ success: boolean; message: string }> {
    const { storeId, date, hash, senderAddress } = context.params;

    // Verify cashier role
    if (!this.hasRoleInternal(senderAddress, 'cashier')) {
      return { success: false, message: 'Unauthorized: Cashier role required' };
    }

    // Validate inputs
    if (!storeId || !date || !hash) {
      return { success: false, message: 'Missing required parameters' };
    }

    // Check if record already exists
    const key = `${storeId}:${date}`;
    if (this.salesRecords.has(key)) {
      return { success: false, message: 'Sales record for this store and date already exists' };
    }

    // Store the record
    const record: SalesRecord = {
      storeId,
      date,
      hash,
      timestamp: Date.now(),
      submittedBy: senderAddress
    };

    this.salesRecords.set(key, record);

    return { success: true, message: 'Sales hash submitted successfully' };
  }

  // Get sales hash (Public)
  public async getSalesHash(context: any): Promise<{ success: boolean; data?: SalesRecord; message: string }> {
    const { storeId, date } = context.params;

    if (!storeId || !date) {
      return { success: false, message: 'Missing required parameters' };
    }

    const key = `${storeId}:${date}`;
    const record = this.salesRecords.get(key);

    if (!record) {
      return { success: false, message: 'No sales record found for the specified store and date' };
    }

    return { success: true, data: record, message: 'Sales record retrieved successfully' };
  }

  // Add user to role (Admin only)
  public async addUser(context: any): Promise<{ success: boolean; message: string }> {
    const { userAddress, role, senderAddress } = context.params;

    // Verify admin role
    if (!this.hasRoleInternal(senderAddress, 'admin')) {
      return { success: false, message: 'Unauthorized: Admin role required' };
    }

    // Validate role
    if (!['admin', 'auditor', 'cashier'].includes(role)) {
      return { success: false, message: 'Invalid role specified' };
    }

    // Add user role
    const userRole: UserRole = {
      address: userAddress,
      role: role as 'admin' | 'auditor' | 'cashier',
      addedBy: senderAddress,
      timestamp: Date.now()
    };

    this.userRoles.set(userAddress, userRole);

    // Add to admin set if admin role
    if (role === 'admin') {
      this.adminAddresses.add(userAddress);
    }

    return { success: true, message: `User added to ${role} role successfully` };
  }

  // Remove user from role (Admin only)
  public async removeUser(context: any): Promise<{ success: boolean; message: string }> {
    const { userAddress, senderAddress } = context.params;

    // Verify admin role
    if (!this.hasRoleInternal(senderAddress, 'admin')) {
      return { success: false, message: 'Unauthorized: Admin role required' };
    }

    // Cannot remove self if last admin
    if (userAddress === senderAddress && this.adminAddresses.size === 1) {
      return { success: false, message: 'Cannot remove the last admin' };
    }

    // Remove user
    const userRole = this.userRoles.get(userAddress);
    if (userRole) {
      this.userRoles.delete(userAddress);
      if (userRole.role === 'admin') {
        this.adminAddresses.delete(userAddress);
      }
      return { success: true, message: 'User removed successfully' };
    }

    return { success: false, message: 'User not found' };
  }

  // Check if user has role (Public)
  public async hasRole(context: any): Promise<{ success: boolean; hasRole: boolean; role?: string }> {
    const { userAddress, role } = context.params;

    const hasRoleResult = this.hasRoleInternal(userAddress, role);
    const userRole = this.userRoles.get(userAddress);

    return {
      success: true,
      hasRole: hasRoleResult,
      role: userRole?.role
    };
  }

  // Get all sales records (Admin only)
  public async getAllSalesRecords(context: any): Promise<{ success: boolean; data?: SalesRecord[]; message: string }> {
    const { senderAddress } = context.params;

    // Verify admin role
    if (!this.hasRoleInternal(senderAddress, 'admin')) {
      return { success: false, message: 'Unauthorized: Admin role required' };
    }

    const records = Array.from(this.salesRecords.values());
    return { success: true, data: records, message: 'Sales records retrieved successfully' };
  }

  // Internal helper to check role
  private hasRoleInternal(address: string, role: string): boolean {
    const userRole = this.userRoles.get(address);
    return userRole?.role === role;
  }

  // Required module methods
  public async beforeBlockApply(_input: BlockExecuteContext): Promise<void> {
    // Implementation for before block apply
  }

  public async afterBlockApply(_input: BlockExecuteContext): Promise<void> {
    // Implementation for after block apply
  }

  public async beforeTransactionApply(_input: TransactionExecuteContext): Promise<void> {
    // Implementation for before transaction apply
  }

  public async afterTransactionApply(_input: TransactionExecuteContext): Promise<void> {
    // Implementation for after transaction apply
  }

  public async afterGenesisBlockApply(_input: GenesisBlockExecuteContext): Promise<void> {
    // Implementation for after genesis block apply
  }

  public async initGenesisState(_input: GenesisBlockExecuteContext): Promise<void> {
    // Implementation for init genesis state
  }

  public async finalizeGenesisState(_input: GenesisBlockExecuteContext): Promise<void> {
    // Implementation for finalize genesis state
  }
}