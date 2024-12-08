import { Dialog } from '@headlessui/react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    price: string;
    description: string;
    images: string[];
  };
  url: string;
}

export default function DetailModal({ isOpen, onClose, data, url }: DetailModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl rounded bg-white p-6 w-full">
          <Dialog.Title className="text-lg font-medium mb-4">{data.title}</Dialog.Title>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Price</h3>
                <p>{data.price}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Description</h3>
                <p className="text-sm text-gray-600">{data.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">URL</h3>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {url}
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {data.images.map((image, index) => (
                <img 
                  key={index} 
                  src={image} 
                  alt={`Product image ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
