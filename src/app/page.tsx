'use client'

import { useState } from 'react'
import SitemapForm from '@/components/SitemapForm'
import { DashboardHeader } from '@/components/DashboardHeader'
import { StatsCard } from '@/components/StatsCard'
import { countUrlsByType } from '@/lib/utils'

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    products: 0,
    categories: 0,
    blogs: 0,
    pages: 0,
  })

  const handleDataUpdate = (data: any[]) => {
    setStats(countUrlsByType(data))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <DashboardHeader />
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total URLs"
          value={stats.total}
          description="Total number of URLs extracted"
        />
        <StatsCard
          title="Products"
          value={stats.products}
          description="Number of product pages found"
        />
        <StatsCard
          title="Categories"
          value={stats.categories}
          description="Number of category pages found"
        />
        <StatsCard
          title="Blog Posts"
          value={stats.blogs}
          description="Number of blog posts found"
        />
      </div> */}

     
    </div>
  )
}
