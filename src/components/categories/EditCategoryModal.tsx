import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Category {
  _id: string;
  name: string;
  description: string | null;
  image: string | null;
  parent: {
    _id: string;
    name: string;
  } | null;
  level: number;
  createdAt: string;
  __v: number;
}

interface EditCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (updatedData: any) => Promise<void>;
  categories: Category[];
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        parent: category.parent?._id || "",
      });
    }
  }, [category]);

  // Get available parent categories
  const getAvailableParents = () => {
    if (!category) return [];

    return categories.filter((c) => {
      // Can't be parent to itself
      if (c._id === category._id) return false;
      
      // Can't set a child category as parent if current is level 1
      if (category.level === 1 && c.level === 1) return false;
      
      // Can't set a category that is already a child of this category
      if (c.parent?._id === category._id) return false;
      
      return true;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Prepare the updated data
    const updatedData: any = {
      name: formData.name,
      description: formData.description || null,
    };

    // Handle parent change - FIXED VERSION
    const currentParentId = category?.parent?._id || "";
    const newParentId = formData.parent;
    
    console.log("Current parent:", currentParentId);
    console.log("New parent:", newParentId);
    console.log("Current level:", category?.level);

    if (newParentId === "") {
      // Removing parent - make it a top-level category
      updatedData.parent = null;
      updatedData.level = 0; // Force level to 0 for top-level
      console.log("Setting to top-level with level 0");
    } 
    else if (newParentId !== currentParentId) {
      // Adding or changing parent
      updatedData.parent = newParentId;
      
      // Find the parent category to determine new level
      const parentCategory = categories.find(c => c._id === newParentId);
      if (parentCategory) {
        updatedData.level = parentCategory.level + 1;
        console.log(`Setting as child of ${parentCategory.name} with level ${parentCategory.level + 1}`);
      }
    } 
    else {
      // Parent hasn't changed, keep the same level
      updatedData.level = category?.level;
      console.log("Parent unchanged, keeping level", category?.level);
    }

    console.log("Sending updated data:", updatedData);
    await onSave(updatedData);
    setSaving(false);
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur - dark mode support */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal content - dark mode */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all animate-fade-in-up">
            {/* Header with dark mode */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Category
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Name Field - dark mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Description Field - dark mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter category description"
                  />
                </div>

                {/* Parent Category Field - dark mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) =>
                      setFormData({ ...formData, parent: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="" className="dark:bg-gray-700">None (Top Level)</option>
                    {getAvailableParents().map((cat) => (
                      <option key={cat._id} value={cat._id} className="dark:bg-gray-700">
                        {cat.name} {cat.level === 0 ? "(Parent)" : "(Child)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to make this a top-level category
                  </p>
                  
                  {/* Show level preview - dark mode */}
                  {formData.parent ? (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This will become a <span className="font-semibold">sub-category</span> of {categories.find(c => c._id === formData.parent)?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        This will become a <span className="font-semibold">top-level category</span> with level 0
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons - dark mode */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;