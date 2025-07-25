import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Activity, BarChart3, Shield, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { adminApi } from '../services/api';

interface User {
  address: string;
  role: string;
}

interface Stats {
  users: {
    total: number;
    admins: number;
    auditors: number;
    cashiers: number;
  };
  salesRecords: {
    total: number;
    thisMonth: number;
  };
  systemHealth: {
    status: string;
    uptime: number;
    lastUpdate: number;
  };
}

interface Logs {
  salesSubmissions: any[];
  auditLogs: any[];
  adminActions: any[];
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Logs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');
  
  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'auditor' | 'cashier'>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statsRes, logsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getStats(),
        adminApi.getLogs()
      ]);

      setUsers(usersRes.data.data || []);
      setStats(statsRes.data.data);
      setLogs(logsRes.data.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await adminApi.addUser(newUserAddress, newUserRole);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'User added successfully!' });
        setNewUserAddress('');
        setNewUserRole('cashier');
        setShowAddUser(false);
        loadData(); // Refresh data
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add user';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (userAddress: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await adminApi.removeUser(userAddress);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'User removed successfully!' });
        loadData(); // Refresh data
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove user';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users and monitor system activity</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Shield className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'logs', label: 'Activity Logs', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.users.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-4 text-sm text-blue-700">
                    {stats.users.admins} Admins • {stats.users.auditors} Auditors • {stats.users.cashiers} Cashiers
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Sales Records</p>
                      <p className="text-2xl font-bold text-green-900">{stats.salesRecords.total}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-4 text-sm text-green-700">
                    {stats.salesRecords.thisMonth} this month
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">System Status</p>
                      <p className="text-2xl font-bold text-purple-900 capitalize">{stats.systemHealth.status}</p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-4 text-sm text-purple-700">
                    Uptime: {formatUptime(stats.systemHealth.uptime)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Add New User</h4>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wallet Address
                        </label>
                        <input
                          type="text"
                          value={newUserAddress}
                          onChange={(e) => setNewUserAddress(e.target.value)}
                          placeholder="lsk..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        >
                          <option value="cashier">Cashier</option>
                          <option value="auditor">Auditor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="submit"
                        disabled={isSubmitting || !newUserAddress}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        {isSubmitting ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
                        <span>Add User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Address</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{user.address}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'auditor' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRemoveUser(user.address)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && logs && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Activity Logs</h3>
              
              <div className="grid gap-6">
                {/* Sales Submissions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Recent Sales Submissions</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {logs.salesSubmissions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No sales submissions yet</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.salesSubmissions.slice(0, 5).map((submission, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>Store {submission.storeId} - {submission.date}</span>
                            <span className="text-gray-500">{formatDate(submission.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Logs */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Recent Audits</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {logs.auditLogs.length === 0 ? (
                      <p className="text-gray-500 text-sm">No audits performed yet</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.auditLogs.slice(0, 5).map((audit, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>
                              Store {audit.storeId} - {audit.hashMatch ? '✅ Verified' : '❌ Mismatch'}
                            </span>
                            <span className="text-gray-500">{formatDate(audit.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Admin Actions</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {logs.adminActions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No admin actions yet</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.adminActions.slice(0, 5).map((action, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>
                              {action.action === 'add_user' ? '➕' : '➖'} {action.action.replace('_', ' ')} - {action.role}
                            </span>
                            <span className="text-gray-500">{formatDate(action.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};