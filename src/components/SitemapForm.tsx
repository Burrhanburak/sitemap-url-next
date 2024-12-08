'use client'

import { useState } from 'react'
import { extractSitemap } from '@/lib/api'
import { ResultsTable } from './ResultsTable'
import { ExportOptions } from './ExportOptions'
import { ProductDetails } from './ProductDetails'
import { exportToCsv, parseUrlType } from '@/lib/utils'

interface SitemapFormProps {
  onDataUpdate?: (data: any[]) => void
}

export default function SitemapForm({ onDataUpdate }: SitemapFormProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await extractSitemap(url)
      const urlset = result.data.urlset?.url || []
      const formattedData = urlset.map((entry: any) => ({
        url: entry.loc[0],
        lastmod: entry.lastmod?.[0],
        type: parseUrlType(entry.loc[0]),
        status: 'active',
        lastChecked: new Date().toISOString(),
      }))
      setResults(formattedData)
      onDataUpdate?.(formattedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract sitemap')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (type: string) => {
    exportToCsv(results, type)
  }

  const productUrls = results
    .filter(item => item.type === 'product')
    .map(item => item.url)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6">Extract Sitemap</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              Website URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                name="url"
                id="url"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter the website URL to extract its sitemap
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Extracting...' : 'Extract Sitemap'}
            </button>
          </div>
        </form>
      </div>

      {results.length > 0 && (
        <>
          <ExportOptions data={results} onExport={handleExport} />
          <ResultsTable data={results} />
          {productUrls.length > 0 && <ProductDetails urls={productUrls} />}
        </>
      )}
    </div>
  )
}
