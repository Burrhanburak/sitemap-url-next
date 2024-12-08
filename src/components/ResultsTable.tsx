'use client'

import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from './DataTable'

interface UrlEntry {
  url: string
  type: string
  lastmod?: string
  status: 'active' | 'inactive' | 'updated'
  lastChecked: string
}

const columnHelper = createColumnHelper<UrlEntry>()

const columns = [
  columnHelper.accessor('url', {
    header: 'URL',
    cell: (info) => (
      <a
        href={info.getValue()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('lastmod', {
    header: 'Last Modified',
    cell: (info) => info.getValue() || 'N/A',
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const colors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        updated: 'bg-yellow-100 text-yellow-800',
      }

      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}
        >
          {status}
        </span>
      )
    },
  }),
  columnHelper.accessor('lastChecked', {
    header: 'Last Checked',
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
]

interface ResultsTableProps {
  data: UrlEntry[]
}

export function ResultsTable({ data }: ResultsTableProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Extracted URLs</h3>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
