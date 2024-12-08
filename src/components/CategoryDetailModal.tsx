import { useState } from 'react';
import Image from 'next/image';

interface CategoryDetailModalProps {
  url: string;
  categoryData: {
    name: string;
    description: string;
    subcategories: Array<{
      name: string;
      url: string;
    }>;
    products: Array<{
      name: string;
      url: string;
      image?: string;
      price?: string;
    }>;
    pagination: {
      currentPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    totalProducts: number;
    totalSubcategories: number;
  };
  onClose: () => void;
}

export default function CategoryDetailModal({ url, categoryData, onClose }: CategoryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'subcategories'>('products');

  const handleImageError = (e: any) => {
    e.target.src = '/placeholder-image.jpg';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
              {categoryData.name || 'Category Details'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {categoryData.description && (
            <div className="px-4 pb-4">
              <p className="text-gray-600">{categoryData.description}</p>
            </div>
          )}

          <div className="px-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products ({categoryData.totalProducts})
              </button>
              <button
                onClick={() => setActiveTab('subcategories')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'subcategories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subcategories ({categoryData.totalSubcategories})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          {activeTab === 'products' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryData.products.map((product, index) => (
                <a
                  key={index}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="aspect-square relative overflow-hidden rounded-lg border border-gray-200 group-hover:border-blue-500 transition-colors">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.price && (
                      <p className="mt-1 text-sm font-medium text-gray-900">{product.price}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryData.subcategories.map((subcategory, index) => (
                <a
                  key={index}
                  href={subcategory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {subcategory.name}
                  </h3>
                </a>
              ))}
            </div>
          )}

          {categoryData.pagination.hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  // Handle pagination
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
