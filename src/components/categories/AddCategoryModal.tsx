import React, { useState, useRef } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface Category {
  _id: string;
  name: string;
  description: string | null;
  image?: string | null;
  parent: {
    _id: string;
    name: string;
  } | null;
  level: number;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: any) => Promise<void>;
  categories: Category[];
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent: "",
    level: 0,
    image: "",
    imageAlt: "",
    bannerImage: "",
    icon: "",
    metaTitle: "",
    metaDescription: "",
    order: 0,
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP, GIF, BMP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    if (type === 'image') {
      setUploadingImage(true);
    } else {
      setUploadingBanner(true);
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === 'image') {
        setImagePreview(base64);
        setFormData({ ...formData, image: base64 });
      } else {
        setBannerPreview(base64);
        setFormData({ ...formData, bannerImage: base64 });
      }
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Failed to process image');
    } finally {
      if (type === 'image') {
        setUploadingImage(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  // Remove image
  const removeImage = (type: 'image' | 'banner') => {
    if (type === 'image') {
      setImagePreview("");
      setFormData({ ...formData, image: "" });
      if (imageInputRef.current) imageInputRef.current.value = "";
    } else {
      setBannerPreview("");
      setFormData({ ...formData, bannerImage: "" });
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const categoryData: any = {
      name: formData.name,
      description: formData.description || null,
      image: formData.image || null,
      imageAlt: formData.imageAlt || null,
      bannerImage: formData.bannerImage || null,
      icon: formData.icon || null,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      order: parseInt(formData.order.toString()) || 0,
      featured: formData.featured,
    };

    // Set level based on parent selection
    if (formData.parent) {
      const parentCategory = categories.find(c => c._id === formData.parent);
      categoryData.parent = formData.parent;
      categoryData.level = parentCategory ? parentCategory.level + 1 : 1;
    } else {
      categoryData.level = 0;
    }

    await onSave(categoryData);
    setSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      parent: "",
      level: 0,
      image: "",
      imageAlt: "",
      bannerImage: "",
      icon: "",
      metaTitle: "",
      metaDescription: "",
      order: 0,
      featured: false,
    });
    setImagePreview("");
    setBannerPreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    onClose();
  };

  // Get only parent categories (level 0) for selection
  const parentCategories = categories.filter(c => c.level === 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal content - made wider for images */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 transform transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Category
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter category description"
                  />
                </div>

                {/* Category Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('image')}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                        onChange={(e) => handleImageUpload(e, 'image')}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          'Choose Image'
                        )}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Max 2MB. JPG, PNG, WEBP, GIF, BMP
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.imageAlt}
                      onChange={(e) =>
                        setFormData({ ...formData, imageAlt: e.target.value })
                      }
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Image alt text (for accessibility)"
                    />
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Image (Optional)
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    {bannerPreview ? (
                      <div className="relative">
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('banner')}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                        onChange={(e) => handleImageUpload(e, 'banner')}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition"
                      >
                        {uploadingBanner ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          'Choose Banner'
                        )}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 1200x400px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Icon Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="e.g., 🎮, 📱, 💻"
                    maxLength={2}
                  />
                </div>

                {/* Parent Category Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) => {
                      const parentId = e.target.value;
                      setFormData({ 
                        ...formData, 
                        parent: parentId,
                      });
                    }}
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="">None (Top Level Category)</option>
                    {parentCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a parent category to create a sub-category
                  </p>
                </div>

                {/* Level indicator */}
                {formData.parent && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      This will be a <span className="font-semibold">sub-category</span> of {categories.find(c => c._id === formData.parent)?.name}
                    </p>
                  </div>
                )}

                {/* SEO Fields */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">SEO Settings (Optional)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, metaTitle: e.target.value })
                        }
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="SEO title (defaults to category name)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({ ...formData, metaDescription: e.target.value })
                        }
                        rows={2}
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="SEO description for search engines"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Display Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                        }
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center mt-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) =>
                            setFormData({ ...formData, featured: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Featured Category
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Create Category"
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

export default AddCategoryModal;