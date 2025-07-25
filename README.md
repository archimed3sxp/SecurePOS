# SecurePOS - Blockchain-Based POS Auditing System

A tamper-proof Point of Sale auditing system built on the Lisk blockchain with role-based access control.

## Features

- **Blockchain-anchored audit logs** - All sales data hashes stored immutably on Lisk
- **Role-based access control** - Admin, Auditor, and Cashier roles with on-chain verification
- **File integrity verification** - SHA-256 hash comparison for audit trails
- **Wallet-based authentication** - Secure access using blockchain wallet addresses

## User Roles

### Admin (Contract Deployer)
- Manage user roles (add/remove Auditors and Cashiers)
- View all activity logs and submissions
- Access to admin panel with full system oversight

### Auditor
- Upload sales files for verification against blockchain hashes
- Access audit panel to compare file integrity
- View verification results and discrepancies

### Cashier
- Submit daily sales files (hashed and stored on-chain)
- Upload interface for sales data submission
- Track submission history

## Tech Stack

- **Blockchain**: Lisk SDK (TypeScript)
- **Backend**: Node.js + Express
- **Frontend**: React + TailwindCSS
- **Hashing**: SHA-256
- **Storage**: Local file system + on-chain hashes

## Project Structure

```
/contracts   → Smart contracts (Lisk SDK)
/backend     → REST API with role-based routing
/frontend    → Role-based React UI
/storage     → Off-chain sales data
/scripts     → Deployment & setup scripts
```

## Quick Start

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Deploy Smart Contract**
   ```bash
   cd contracts
   npm run deploy
   ```

## API Endpoints

### Cashier Routes
- `POST /api/submit-sales` - Submit sales file for hashing and blockchain storage

### Auditor Routes
- `POST /api/verify` - Verify uploaded file against blockchain hash

### Admin Routes
- `POST /api/admin/add-user` - Add user to specific role
- `DELETE /api/admin/remove-user` - Remove user from role
- `GET /api/admin/logs` - View all submission history

## Smart Contract Methods

- `submitSalesHash(storeId, date, hash)` - Store sales hash (Cashier only)
- `getSalesHash(storeId, date)` - Retrieve stored hash (Public)
- `addUser(address, role)` - Add user to role (Admin only)
- `removeUser(address, role)` - Remove user from role (Admin only)
- `hasRole(address, role)` - Check user role (Public)

## Security Features

- On-chain role verification for all operations
- Tamper-proof audit trails using blockchain immutability
- SHA-256 file integrity verification
- Wallet-based authentication and authorization

## Development

The system uses a modular architecture with clear separation between blockchain logic, API services, and user interface components. Each role has specific permissions enforced both on-chain and in the application layer.