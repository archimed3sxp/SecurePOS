import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { auditApi } from '../services/api';

interface AuditResult {
  storeId: string;
  date: string;
  hashMatch: boolean;
  uploadedHash: string;
  storedHash: string;
  originalSubmission: {
    submittedBy: string;
    timestamp: number;
  };
  auditDetails: {
    auditedBy: string;
    auditTimestamp: number;
  };
}

interface AuditHistory {
  auditedBy: string;
  storeId: string;
  date: string;
  uploadedHash: string;
  storedHash: string;
  hashMatch: boolean;
  filename: string;
  fileSize: number;
  timestamp: number;
  originalSubmission: {
    submittedBy: string;
    timestamp: number;
  };
}

export const AuditorDashboard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAuditHistory();
  }, []);

  const loadAuditHistory = async () => {
    try {
      const response = await auditApi.getAuditHistory();
      setAuditHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to load audit history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !storeId || !date) return;

    setIsVerifying(true);
    setMessage(null);
    setAuditResult(null);

    try {
      const formData = new FormData();
      formData.append('auditFile', selectedFile);
      formData.append('storeId', storeId);
      formData.append('date', date);

      const response = await auditApi.verifyFile(formData);
      
      if (response.data.success) {
        setAuditResult(response.data.data);
        setMessage({ 
          type: response.data.data.hashMatch ? 'success' : 'error', 
          text: response.data.message 
        });
        loadAuditHistory(); // Refresh the history
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify file';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsVerifying(false);
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

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auditor Dashboard</h1>
        <p className="text-gray-600">Verify sales files against blockchain records</p>
      </div>

      {/* Verification Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Search className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Verify Sales File</h2>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
                Store ID
              </label>
              <input
                type="text"
                id="storeId"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="e.g., STORE001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isVerifying}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Sales Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isVerifying}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File to Verify
            </label>
            <FileUpload
              onFileSelect={setSelectedFile}
              disabled={isVerifying}
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || !storeId || !date || isVerifying}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Against Blockchain</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result */}
      {auditResult && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            {auditResult.hashMatch ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900">Verification Result</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                <p className="text-gray-900 font-medium">{auditResult.storeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <p className="text-gray-900 font-medium">{auditResult.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  {auditResult.hashMatch ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">Mismatch</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded File Hash</label>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono block">
                  {auditResult.uploadedHash}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blockchain Hash</label>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono block">
                  {auditResult.storedHash}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Submission</label>
                <p className="text-sm text-gray-600">
                  By {auditResult.originalSubmission.submittedBy.slice(0, 8)}... on{' '}
                  {formatDate(auditResult.originalSubmission.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit History */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Audit History</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : auditHistory.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No audits performed yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Store ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">File</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Audited</th>
                </tr>
              </thead>
              <tbody>
                {auditHistory.map((audit, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{audit.storeId}</td>
                    <td className="py-3 px-4">{audit.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {audit.hashMatch ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 text-sm font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 text-sm font-medium">Mismatch</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{audit.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(audit.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};