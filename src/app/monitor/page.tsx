'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MonitoredURL {
  url: string;
  lastScanned: string;
  status: 'success' | 'error' | 'pending';
  type: string;
  details?: any;
  changeHistory?: {
    date: string;
    changes: string[];
  }[];
  scanHistory?: {
    date: string;
    status: 'success' | 'error' | 'pending';
  }[];
}

export default function MonitorPage() {
  const [monitoredUrls, setMonitoredUrls] = useState<MonitoredURL[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Load monitored URLs from localStorage
    const loadMonitoredUrls = () => {
      const savedUrls = localStorage.getItem('monitoredUrls');
      if (savedUrls) {
        const urls = JSON.parse(savedUrls);
        // Initialize scanHistory if it doesn't exist
        const urlsWithHistory = urls.map((url: MonitoredURL) => ({
          ...url,
          scanHistory: url.scanHistory || [{
            date: url.lastScanned,
            status: url.status
          }]
        }));
        setMonitoredUrls(urlsWithHistory);
      }
      setLoading(false);
    };

    loadMonitoredUrls();
    // Set up periodic refresh
    const interval = setInterval(loadMonitoredUrls, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredUrls = monitoredUrls.filter(url => {
    if (filter === 'all') return true;
    if (filter === 'products') return url.type === 'product';
    if (filter === 'categories') return url.type === 'category';
    if (filter === 'errors') return url.status === 'error';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">URL Monitor</h1>
          <Link
            href="/scan"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Scan New URLs
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {['all', 'products', 'categories', 'errors'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUrls.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No URLs being monitored</p>
            <Link
              href="/scan"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Scanning
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Scanned
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changes
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUrls.map((item) => (
                  <tr key={item.url} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-md">
                        {item.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${item.type === 'product' ? 'bg-green-100 text-green-800' :
                          item.type === 'category' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastScanned).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.changeHistory?.length || 0} changes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedUrl(item.url)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Details Modal */}
        {selectedUrl && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">URL Details</h3>
                  <button
                    onClick={() => setSelectedUrl(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                {selectedUrl && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Scan History</h4>
                    <div className="space-y-4">
                      {monitoredUrls.find(item => item.url === selectedUrl)?.scanHistory?.map((scan, index) => (
                        <div key={index} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${getStatusColor(scan.status)}`}
                          >
                            {scan.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(scan.date).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {monitoredUrls.find(item => item.url === selectedUrl)?.changeHistory?.length > 0 && (
                      <>
                        <h4 className="text-lg font-medium text-gray-900 mt-6 mb-4">Changes Detected</h4>
                        {monitoredUrls.find(item => item.url === selectedUrl)?.changeHistory?.map((change, index) => (
                          <div key={index} className="mb-4 last:mb-0 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-500 mb-2 font-medium">
                              {new Date(change.date).toLocaleString()}
                            </div>
                            <ul className="list-disc list-inside space-y-1">
                              {change.changes.map((change, changeIndex) => (
                                <li key={changeIndex} className="text-sm text-gray-900">
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </>
                    )}

                    {(!monitoredUrls.find(item => item.url === selectedUrl)?.scanHistory?.length && 
                      !monitoredUrls.find(item => item.url === selectedUrl)?.changeHistory?.length) && (
                      <div className="text-center py-6 text-gray-500">
                        No scan history available
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUrl(null)}
                  className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
