import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { salesApi } from '../services/api';

interface Submission {
  storeId: string;
  date: string;
  hash: string;
  filename: string;
  originalName: string;
  size: number;
  timestamp: number;
}

export const CashierDashboard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storeId, setStoreId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await salesApi.getSubmissions();
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !storeId || !date) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('salesFile', selectedFile);
      formData.append('storeId', storeId);
      formData.append('date', date);

      const response = await salesApi.submitSales(formData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Sales file submitted successfully!' });
        setSelectedFile(null);
        setStoreId('');
        setDate(new Date().toISOString().split('T')[0]);
        loadSubmissions(); // Refresh the list
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit sales file';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cashier Dashboard</h1>
        <p className="text-gray-600">Submit daily sales files for blockchain verification</p>
      </div>

      {/* Submit Sales Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Submit Sales Data</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales File
            </label>
            <FileUpload
              onFileSelect={setSelectedFile}
              disabled={isSubmitting}
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

          <button
            type="submit"
            disabled={!selectedFile || !storeId || !date || isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit to Blockchain</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Submission History */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Submission History</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Store ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">File</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hash</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{submission.storeId}</td>
                    <td className="py-3 px-4">{submission.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{submission.originalName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatFileSize(submission.size)}
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {submission.hash.slice(0, 12)}...
                      </code>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(submission.timestamp)}
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