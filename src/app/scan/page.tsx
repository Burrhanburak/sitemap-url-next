'use client';

import { useState, useEffect } from 'react';
import { ParsedUrl } from '@/lib/parser';
import ProductDetailModal from '@/components/ProductDetailModal';
import Link from 'next/link';

interface ScanResult {
  urls: {
    product: ParsedUrl[];
    category?: ParsedUrl[];
    blog?: ParsedUrl[];
    page?: ParsedUrl[];
  };
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

interface DetailModalProps {
  url: string;
  onClose: () => void;
}

function DetailModal({ url, onClose }: DetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/parse-product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const data = await response.json();
        setProductData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <button 
                onClick={onClose}
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to URLs
              </button>
              <h3 className="text-xl font-semibold">Product Details</h3>
            </div>
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Visit Website →
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 py-8 text-center">
              {error}
            </div>
          ) : productData ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  {productData.images && productData.images.length > 0 && (
                    <div className="space-y-4">
                      <div className="relative w-full h-48">
                        <img 
                          src={productData.images[0]} 
                          alt={productData.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {productData.images.slice(1).map((image: string, index: number) => (
                          <div key={index} className="relative w-full h-20">
                            <img 
                              src={image}
                              alt={`${productData.title} - ${index + 2}`}
                              className="w-full h-full object-cover rounded shadow"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{productData.title}</h2>
                    <div className="text-xl font-semibold text-blue-600">
                      {productData.price}
                    </div>
                  </div>
                  {productData.category && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                      <p className="text-gray-900">{productData.category}</p>
                    </div>
                  )}
                  {productData.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-gray-900 whitespace-pre-line">{productData.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 py-8 text-center">
              No product details available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductTableModalProps {
  urls: string[];
  productDetails: Record<string, any>;
  onClose: () => void;
}

const ProductTableModal: React.FC<ProductTableModalProps> = ({ urls, productDetails, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Product Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(90vh-8rem)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {urls.map((url, index) => {
                const product = productDetails[url];
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product?.images?.[0] && (
                        <div className="relative w-20 h-20">
                          <img 
                            src={product.images[0]} 
                            alt={product.title || 'Product'} 
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product?.title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product?.price || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {product?.description || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Visit →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapModalProps {
  urls: SitemapUrl[];
  onClose: () => void;
  onUrlClick?: (loc: string) => void;
  isSitemapIndex?: boolean;
}

const SitemapModal: React.FC<SitemapModalProps> = ({ urls, onClose, onUrlClick, isSitemapIndex }) => {
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const fetchProductDetails = async (url: string) => {
    if (productDetails[url] || loadingStates[url]) return;

    setLoadingStates(prev => ({ ...prev, [url]: true }));
    try {
      const response = await fetch('/api/parse-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const data = await response.json();
      setProductDetails(prev => ({ ...prev, [url]: data }));
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [url]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold">
              {isSitemapIndex ? 'Available Sitemaps' : 'URLs in Sitemap'}
            </h2>
            <p className="text-sm text-gray-500">
              {urls.length} {isSitemapIndex ? 'sitemaps' : 'URLs'} found
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change Frequency
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {urls.map((url, index) => (
                <tr 
                  key={url.loc} 
                  className="hover:bg-gray-50"
                  onMouseEnter={() => !isSitemapIndex && fetchProductDetails(url.loc)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-md">
                      {url.loc}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {url.lastmod ? new Date(url.lastmod).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {url.changefreq || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {url.priority || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-4">
                      {!isSitemapIndex && loadingStates[url.loc] && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                      {!isSitemapIndex && productDetails[url.loc] && (
                        <div className="flex items-center gap-4 min-w-[300px]">
                          {productDetails[url.loc].images?.[0] && (
                            <div className="relative w-12 h-12">
                              <img 
                                src={productDetails[url.loc].images[0]} 
                                alt={productDetails[url.loc].title}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {productDetails[url.loc].title}
                            </div>
                            <div className="text-sm text-blue-600">
                              {productDetails[url.loc].price}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {isSitemapIndex ? (
                          <button
                            onClick={() => onUrlClick?.(url.loc)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Scan →
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onUrlClick?.(url.loc)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Details
                            </button>
                            <a
                              href={url.loc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 ml-2"
                            >
                              Visit →
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [previousScans, setPreviousScans] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (input: string) => {
    if (!input) {
      setError('Please enter a sitemap URL or JSON data');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sitemap');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReturn = () => {
    if (previousScans.length > 0) {
      const lastScan = previousScans[previousScans.length - 1];
      setResult(lastScan);
      setPreviousScans(prev => prev.slice(0, -1));
      setSelectedProduct(null);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredUrls = result?.urls?.filter((url: any) => activeFilters.length === 0 || activeFilters.includes(url.type));

  const urlTypes = result?.urls?.map((url: any) => url.type);

  const fetchProductDetails = async (productUrl: string) => {
    if (loadingStates[productUrl]) return;

    try {
      setLoadingStates(prev => ({ ...prev, [productUrl]: true }));
      
      const response = await fetch('/api/parse-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      setProductDetails(prev => ({ ...prev, [productUrl]: data }));
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [productUrl]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(url);
  };

  const detectUrlType = (urlString: string) => {
    const lowercaseUrl = urlString.toLowerCase();
    
    if (lowercaseUrl.includes('toptanturkiye.com')) {
      if (lowercaseUrl.includes('sitemap_product')) return 'product';
      if (lowercaseUrl.includes('sitemap_blog')) return 'blog';
      if (lowercaseUrl.includes('sitemap_blogtag')) return 'tag';
      if (lowercaseUrl.includes('sitemap_blogcategory')) return 'category';
      
      const urlParts = lowercaseUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      if (lastPart.startsWith('p-')) return 'product';
      if (lastPart.startsWith('b-')) return 'blog';
      if (lastPart.startsWith('t-')) return 'tag';
      if (lastPart.startsWith('c-')) return 'category';
    }
    
    if (lowercaseUrl.includes('/product/') || lowercaseUrl.includes('/urun/')) return 'product';
    if (lowercaseUrl.includes('/blog/') || lowercaseUrl.includes('/post/')) return 'blog';
    if (lowercaseUrl.includes('/category/') || lowercaseUrl.includes('/kategori/')) return 'category';
    if (lowercaseUrl.includes('/tag/')) return 'tag';
    
    const urlPattern = /\/(products?|blogs?|categories|tags?|posts?)\//i;
    const match = lowercaseUrl.match(urlPattern);
    if (match) {
      const type = match[1].toLowerCase();
      if (type.startsWith('product')) return 'product';
      if (type.startsWith('blog') || type.startsWith('post')) return 'blog';
      if (type.startsWith('categor')) return 'category';
      if (type.startsWith('tag')) return 'tag';
    }
    
    return 'other';
  };

  const isLikelyProductUrl = (url: string): boolean => {
    const lowercaseUrl = url.toLowerCase();
    
    // If the URL is from tahtakaletoptanticaret.com, treat all non-special URLs as products
    if (lowercaseUrl.includes('tahtakaletoptanticaret.com')) {
      const excludePatterns = [
        '/sitemap.xml',
        '/wp-content/',
        '/wp-admin/',
        '/category/',
        '/tag/',
        '/page/',
        '/blog/',
        '/hakkimizda',
        '/iletisim',
        '/hesabim',
        '/sepet',
        '/odeme'
      ];
      return !excludePatterns.some(pattern => lowercaseUrl.includes(pattern));
    }

    // General product URL patterns for other sites
    return (
      lowercaseUrl.includes('/product/') ||
      lowercaseUrl.includes('/urun/') ||
      lowercaseUrl.includes('/p/') ||
      /\/[a-z0-9-]+-p-[0-9]+/.test(lowercaseUrl) ||
      lowercaseUrl.includes('/products/') ||
      lowercaseUrl.match(/\/(pd|pid|item|sku)\//) !== null ||
      // Additional patterns for e-commerce URLs
      /\d+ml-[a-z0-9-]+/.test(lowercaseUrl) || // Matches patterns like "500ml-product-name"
      /toptan-[a-z0-9-]+/.test(lowercaseUrl) || // Matches patterns like "toptan-product-name"
      /-set-/.test(lowercaseUrl) // Matches product set URLs
    );
  };

  const isSitemapUrl = (url: string): boolean => {
    const lowercaseUrl = url.toLowerCase();
    return (
      lowercaseUrl.includes('sitemap') ||
      lowercaseUrl.endsWith('.xml') ||
      lowercaseUrl.includes('/feed/') ||
      lowercaseUrl.includes('/feeds/')
    );
  };

  const handleUrlAction = async (url: string) => {
    if (isSitemapUrl(url)) {
      // If it's a sitemap URL, scan it
      handleScan(url);
    } else {
      // If it's a direct product URL, show details
      handleViewDetails(url);
    }
  };

  const handleQuickView = async (url: string) => {
    if (isLikelyProductUrl(url)) {
      setSelectedProduct(url);
      if (!productDetails[url]) {
        await fetchProductDetails(url);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const handleViewDetails = async (url: string) => {
    setSelectedProduct(url);
    if (!productDetails[url]) {
      await fetchProductDetails(url);
    }
  };

  const getUrlTypeDisplay = (type: string) => {
    const displayNames: Record<string, string> = {
      'product': 'Products',
      'blog': 'Blog Posts',
      'category': 'Categories',
      'tag': 'Tags',
      'other': 'Other'
    };
    return displayNames[type] || type;
  };

  const handleJsonScan = () => {
    setError('');
    if (!jsonInput.trim()) {
      setError('Please enter URLs in JSON format');
      return;
    }

    try {
      let urls: string[] = [];
      const trimmedInput = jsonInput.trim();
      
      // Try parsing as JSON first
      try {
        const parsed = JSON.parse(trimmedInput);
        if (Array.isArray(parsed)) {
          urls = parsed;
        } else if (typeof parsed === 'string') {
          urls = [parsed];
        } else {
          throw new Error('Invalid JSON format');
        }
      } catch (jsonError) {
        // If JSON parsing fails, try treating it as plain text with URLs
        urls = trimmedInput
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('http'));
        
        if (urls.length === 0) {
          throw new Error('No valid URLs found');
        }
      }

      // Validate URLs
      urls = urls.filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

      if (urls.length === 0) {
        setError('No valid URLs found');
        return;
      }

      // Create result object
      const newResult = {
        urls: urls.map(url => ({
          loc: url,
          type: isLikelyProductUrl(url) ? 'product' : 'other',
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: '1.0'
        })),
        isSitemapIndex: false
      };

      setResult(newResult);
      setJsonInput(''); // Clear input after successful scan
    } catch (error) {
      console.error('Error processing input:', error);
      setError('Please enter valid URLs (one per line or as JSON array)');
    }
  };

  const exportToCsv = () => {
    if (!result?.urls?.length) return;

    const headers = ['URL', 'Type', 'Last Modified', 'Change Frequency', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...result.urls.map(url => [
        url.loc,
        url.type,
        url.lastmod,
        url.changefreq,
        url.priority
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sitemap_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/monitor"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Return to Monitor
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sitemap Scanner
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a sitemap URL or paste URLs directly
                </p>
              </div>
            </div>
            {result?.urls?.length > 0 && (
              <button
                onClick={exportToCsv}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export All URLs to CSV
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUrl('')}
                className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700"
              >
                URL Input
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter sitemap URL..."
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <button
                type="submit"
                disabled={isScanning || !url.trim()}
                className={`w-full px-6 py-3 rounded-lg shadow-sm font-medium transition-colors ${
                  isScanning || !url.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <span className="inline-flex items-center">
                  {isScanning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Scan URL
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {result?.urls && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {result.isSitemapIndex ? 'Available Sitemaps' : 'URLs in Sitemap'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredUrls?.length} of {result.urls.length} {result.isSitemapIndex ? 'sitemaps' : 'URLs'} shown
                    </p>
                  </div>
                </div>
                {!result.isSitemapIndex && urlTypes && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(urlTypes)).map((type: string) => (
                      <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          activeFilters.includes(type)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {getUrlTypeDisplay(type)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {!result.isSitemapIndex && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Preview
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Frequency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    {!result.isSitemapIndex && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Info
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUrls?.map((url: any) => (
                    <tr 
                      key={url.loc} 
                      className="hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => !result.isSitemapIndex && url.type === 'product' && fetchProductDetails(url.loc)}
                    >
                      {!result.isSitemapIndex && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {url.type === 'product' && (
                            loadingStates[url.loc] ? (
                              <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            ) : productDetails[url.loc] ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {productDetails[url.loc].title}
                                </div>
                                {productDetails[url.loc].price && (
                                  <div className="text-sm font-semibold text-green-600">
                                    {productDetails[url.loc].price}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => fetchProductDetails(url.loc)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                View Details
                              </button>
                            )
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-md">
                          {url.loc}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${url.type === 'product' ? 'bg-green-100 text-green-800' :
                            url.type === 'blog' ? 'bg-purple-100 text-purple-800' :
                            url.type === 'category' ? 'bg-yellow-100 text-yellow-800' :
                            url.type === 'tag' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {getUrlTypeDisplay(url.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {url.lastmod ? new Date(url.lastmod).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {url.changefreq || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {url.priority || '-'}
                        </div>
                      </td>
                      {!result.isSitemapIndex && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {url.type === 'product' && productDetails[url.loc] && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {productDetails[url.loc].title}
                              </div>
                              <div className="text-sm font-semibold text-blue-600">
                                {productDetails[url.loc].price}
                              </div>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleUrlAction(url.loc)}
                            className={`inline-flex items-center px-3 py-1.5 rounded transition-colors ${
                              isSitemapUrl(url.loc)
                                ? 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {isSitemapUrl(url.loc) ? (
                              <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Scan
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Details
                              </>
                            )}
                          </button>
                          <a
                            href={url.loc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            Visit →
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Product Details
                  </h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {loadingStates[selectedProduct] ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-64 bg-gray-200 rounded w-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : productDetails[selectedProduct] ? (
                  <div className="space-y-4">
                    {productDetails[selectedProduct].images?.[0] && (
                      <img
                        src={productDetails[selectedProduct].images[0]}
                        alt={productDetails[selectedProduct].title}
                        className="w-full h-64 object-contain rounded-lg"
                      />
                    )}
                    <h4 className="text-xl font-medium text-gray-900">
                      {productDetails[selectedProduct].title}
                    </h4>
                    {productDetails[selectedProduct].price && (
                      <div className="text-lg font-semibold text-green-600">
                        {productDetails[selectedProduct].price}
                      </div>
                    )}
                    {productDetails[selectedProduct].description && (
                      <p className="text-gray-600">
                        {productDetails[selectedProduct].description}
                      </p>
                    )}
                    {productDetails[selectedProduct].categories?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {productDetails[selectedProduct].categories.map((category: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Loading product details...
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <a
                  href={selectedProduct}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Visit Product Page
                </a>
              </div>
            </div>
          </div>
        )}
        {/* JSON Input Section
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Scan URLs from Text or JSON
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Enter URLs (one per line) or as JSON array:
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Example formats:<br />
                1. One URL per line:<br />
                https://example.com/product1<br />
                https://example.com/product2<br />
                <br />
                2. JSON array:<br />
                ["https://example.com/product1", "https://example.com/product2"]
              </p>
            </div>
            <div className="mt-5">
              <textarea
                rows={6}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md font-mono"
                placeholder="https://example.com/product1&#13;&#10;https://example.com/product2"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={handleJsonScan}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan URLs
              </button>
              {result?.urls?.length > 0 && (
                <span className="text-sm text-gray-500">
                  {result.urls.length} URLs found
                </span>
              )}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
