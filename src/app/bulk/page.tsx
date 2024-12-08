'use client'

import { useState } from 'react'

export default function BulkExtractPage() {
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Split URLs by newline and filter empty lines
    const urlList = urls.split('\n').filter(url => url.trim())
    
    try {
      // Process each URL (to be implemented)
      console.log('Processing URLs:', urlList)
    } catch (error) {
      console.error('Error processing URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Keyword Bulk Extract</h1>
        
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="urls" className="block text-sm font-medium text-gray-700">
                  Enter URLs (one per line)
                </label>
                <div className="mt-1">
                  <textarea
                    id="urls"
                    name="urls"
                    rows={10}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter one URL per line. Maximum 100 URLs per batch.
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Extract Sitemaps'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Batch Processing</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    Process up to 100 sitemaps simultaneously
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Export Options</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    Export results in CSV, JSON, or Excel format
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Error Handling</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    Detailed error reporting for failed extractions
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">URL Validation</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    Automatic validation and cleaning of input URLs
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
