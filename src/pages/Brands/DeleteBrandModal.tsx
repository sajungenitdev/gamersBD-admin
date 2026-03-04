// components/Brands/DeleteBrandModal.tsx
import { useState } from "react";
import { Brand } from "../../services/brand.service";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Button from "../../components/ui/button/Button";

interface DeleteBrandModalProps {
  isOpen: boolean;
  brand: Brand | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteBrandModal({ 
  isOpen, 
  brand, 
  onClose, 
  onConfirm 
}: DeleteBrandModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !brand) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Brand
            </h3>

            <div className="text-center mb-6">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Are you sure you want to delete this brand?
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">
                  {brand.name}
                </p>
                {brand.productCount > 0 && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    ⚠️ This brand has {brand.productCount} product(s). 
                    Deleting it will affect these products.
                  </p>
                )}
              </div>
            </div>

            {/* Warning for brands with products */}
            {brand.productCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Warning:</strong> This action cannot be undone. 
                  Please update or reassign the products first.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Brand'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}