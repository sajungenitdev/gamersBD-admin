"use client";

import React, { useState } from "react";
import {  TrashBinIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteBlogModalProps {
  isOpen: boolean;
  blog: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteBlogModal({
  isOpen,
  blog,
  onClose,
  onConfirm,
}: DeleteBlogModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Blog Post
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <TrashBinIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete this blog post?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <strong>"{blog?.title}"</strong> will be permanently removed.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400">
                This action cannot be undone.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}