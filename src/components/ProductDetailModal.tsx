import { useState } from 'react';
import Image from 'next/image';

interface ProductDetailModalProps {
  url: string;
  productData: {
    title: string;
    description: string;
    price: string;
    images: string[];
    category: string;
    specs?: Record<string, string>;
    attributes?: Record<string, string>;
  };
  onClose: () => void;
}

export default function ProductDetailModal({ url, productData, onClose }: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const handleImageError = (e: any) => {
    e.target.src = '/placeholder-image.jpg';
  };

  const normalizeImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    return `https://ideacdn.net${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const images = Array.isArray(productData.images) 
    ? productData.images.map(normalizeImageUrl)
    : [normalizeImageUrl(productData.images || '')];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
              {productData.title || 'Product Details'}
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
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={images[selectedImage]}
                  alt={productData.title || 'Product image'}
                  fill
                  className="object-contain"
                  onError={handleImageError}
                  unoptimized
                />
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square rounded-lg border ${
                        selectedImage === index
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      } overflow-hidden`}
                    >
                      <Image
                        src={image}
                        alt={`Product thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
                <div className="mt-2 space-y-4">
                  {productData.price && (
                    <p className="text-2xl font-bold text-gray-900">{productData.price}</p>
                  )}
                  {productData.category && (
                    <p className="text-sm text-gray-500">
                      Category: <span className="text-gray-900">{productData.category}</span>
                    </p>
                  )}
                  {productData.description && (
                    <p className="text-gray-600 whitespace-pre-line">{productData.description}</p>
                  )}
                </div>
              </div>

              {(productData.specs && Object.keys(productData.specs).length > 0) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Specifications</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                    {Object.entries(productData.specs).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {(productData.attributes && Object.keys(productData.attributes).length > 0) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Details</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                    {Object.entries(productData.attributes).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Visit Product Page
                  <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
