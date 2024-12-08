export function parseUrlType(url: string): string {
  if (url.includes('/product/')) return 'product'
  if (url.includes('/category/')) return 'category'
  if (url.includes('/blog/')) return 'blog'
  return 'page'
}

export function formatDate(date: string | undefined): string {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleString()
  } catch {
    return 'Invalid Date'
  }
}

export function getStatusColor(status: string): string {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    updated: 'bg-yellow-100 text-yellow-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function exportToCsv(data: any[], type: string) {
  // Filter data by type if not 'all'
  const filteredData = type === 'all' 
    ? data 
    : data.filter(item => item.type === type)

  // Define CSV headers
  const headers = ['URL', 'Type', 'Last Modified', 'Status', 'Last Checked']
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...filteredData.map(item => [
      `"${item.url}"`,
      item.type,
      item.lastmod || '',
      item.status,
      item.lastChecked
    ].join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `sitemap_${type}_urls.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function countUrlsByType(data: any[]) {
  return {
    total: data.length,
    products: data.filter(item => item.type === 'product').length,
    categories: data.filter(item => item.type === 'category').length,
    blogs: data.filter(item => item.type === 'blog').length,
    pages: data.filter(item => item.type === 'page').length,
  }
}
