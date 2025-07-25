import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Wallet, Users, FileCheck, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const LoginPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(walletAddress);
      if (success) {
        // Redirect based on role
        const role = localStorage.getItem('userRole');
        navigate(`/${role}`);
      } else {
        setError('Invalid wallet address or unauthorized access');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (address: string, role: string) => {
    setWalletAddress(address);
    login(address).then((success) => {
      if (success) {
        navigate(`/${role}`);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        {/* Left Side - Branding */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SecurePOS</h1>
                <p className="text-gray-600">Blockchain Audit System</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tamper-Proof POS Auditing
            </h2>
            <p className="text-gray-600 mb-8">
              Secure your retail operations with blockchain-anchored audit trails. 
              Every transaction is verified and immutable.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-gray-700">Immutable audit logs on Lisk blockchain</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Role-based access control</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-gray-700">Real-time verification system</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Wallet className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Connect Your Wallet</h3>
            <p className="text-gray-600">Enter your Lisk wallet address to access the system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !walletAddress}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 text-center">Demo Accounts:</p>
            <div className="space-y-2">
              <button
                onClick={() => quickLogin('lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu', 'admin')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Admin</span>
                  <span className="text-xs text-gray-500 font-mono">lsk24cd...g5eu</span>
                </div>
              </button>
              <button
                onClick={() => quickLogin('lsk2a8h3k9j4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b', 'auditor')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Auditor</span>
                  <span className="text-xs text-gray-500 font-mono">lsk2a8...7a8b</span>
                </div>
              </button>
              <button
                onClick={() => quickLogin('lsk3b9i4k0j5m6n7p8q9r0s1t2u3v4w5x6y7z8a9c', 'cashier')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Cashier</span>
                  <span className="text-xs text-gray-500 font-mono">lsk3b9...a9c</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};