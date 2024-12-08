'use client'

import { useState } from 'react'

interface ExportOptionsProps {
  data: any[]
  onExport: (type: string) => void
}

export function ExportOptions({ data, onExport }: ExportOptionsProps) {
  const [selectedType, setSelectedType] = useState('all')

  const handleExport = () => {
    onExport(selectedType)
  }

  const urlTypes = [
    { value: 'all', label: 'All URLs' },
    { value: 'product', label: 'Product URLs' },
    { value: 'category', label: 'Category URLs' },
    { value: 'blog', label: 'Blog URLs' },
    { value: 'page', label: 'Other Pages' },
  ]

  const getUrlCountByType = (type: string) => {
    if (type === 'all') return data.length
    return data.filter(item => item.type === type).length
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mt-4">
      <h3 className="text-lg font-medium mb-4">Export Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select URL Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {urlTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({getUrlCountByType(type.value)})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  )
}
