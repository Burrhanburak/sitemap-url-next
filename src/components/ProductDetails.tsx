'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Product {
  url: string
  name: string
  image: string
  price?: string
  description?: string
}

interface ProductDetailsProps {
  urls: string[]
}

export function ProductDetails({ urls }: ProductDetailsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProductDetails = async (url: string) => {
    try {
      const response = await fetch('/api/parse-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch product details')
      return await response.json()
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  useEffect(() => {
    const getProductDetails = async () => {
      if (!urls.length) return
      
      setLoading(true)
      setError('')
      
      try {
        const productUrls = urls.filter(url => url.includes('/product/'))
        const productDetails = await Promise.all(
          productUrls.slice(0, 10).map(fetchProductDetails)
        )
        
        setProducts(productDetails.filter(Boolean))
      } catch (err) {
        setError('Failed to fetch product details')
      } finally {
        setLoading(false)
      }
    }

    getProductDetails()
  }, [urls])

  if (loading) {
    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Product Details</h3>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Product Details</h3>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!products.length) {
    return null
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Product Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="relative h-48 mb-4">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
            {product.price && (
              <p className="text-green-600 font-medium">{product.price}</p>
            )}
            {product.description && (
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                {product.description}
              </p>
            )}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 block"
            >
              View Product →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
