import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface Category {
  _id: string;
  name: string;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  bannerImage?: string | null;
  icon?: string | null;
  parent: {
    _id: string;
    name: string;
  } | null;
  level: number;
  order?: number;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
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
    image: "",
    imageAlt: "",
    bannerImage: "",
    icon: "",
    metaTitle: "",
    metaDescription: "",
    order: 0,
    featured: false,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalBanner, setOriginalBanner] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        parent: category.parent?._id || "",
        image: category.image || "",
        imageAlt: category.imageAlt || "",
        bannerImage: category.bannerImage || "",
        icon: category.icon || "",
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        order: category.order || 0,
        featured: category.featured || false,
        isActive: category.isActive !== undefined ? category.isActive : true,
      });
      setImagePreview(category.image || "");
      setBannerPreview(category.bannerImage || "");
      setOriginalImage(category.image || null);
      setOriginalBanner(category.bannerImage || null);
    }
  }, [category]);

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
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP, GIF, BMP)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    if (type === "image") {
      setUploadingImage(true);
    } else {
      setUploadingBanner(true);
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === "image") {
        setImagePreview(base64);
        setFormData({ ...formData, image: base64 });
      } else {
        setBannerPreview(base64);
        setFormData({ ...formData, bannerImage: base64 });
      }
    } catch (error) {
      console.error("Error converting image:", error);
      alert("Failed to process image");
    } finally {
      if (type === "image") {
        setUploadingImage(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  // Remove image
  const removeImage = (type: "image" | "banner") => {
    if (type === "image") {
      setImagePreview("");
      setFormData({ ...formData, image: "" });
      if (imageInputRef.current) imageInputRef.current.value = "";
    } else {
      setBannerPreview("");
      setFormData({ ...formData, bannerImage: "" });
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

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
      image: formData.image || null,
      imageAlt: formData.imageAlt || null,
      bannerImage: formData.bannerImage || null,
      icon: formData.icon || null,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      order: parseInt(formData.order.toString()) || 0,
      featured: formData.featured,
      isActive: formData.isActive,
    };

    // Handle parent change
    const currentParentId = category?.parent?._id || "";
    const newParentId = formData.parent;

    console.log("Current parent:", currentParentId);
    console.log("New parent:", newParentId);
    console.log("Current level:", category?.level);

    if (newParentId === "") {
      // Removing parent - make it a top-level category
      updatedData.parent = null;
      updatedData.level = 0;
      console.log("Setting to top-level with level 0");
    } else if (newParentId !== currentParentId) {
      // Adding or changing parent
      updatedData.parent = newParentId;

      // Find the parent category to determine new level
      const parentCategory = categories.find((c) => c._id === newParentId);
      if (parentCategory) {
        updatedData.level = parentCategory.level + 1;
        console.log(
          `Setting as child of ${parentCategory.name} with level ${parentCategory.level + 1}`,
        );
      }
    } else {
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
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal content - wider for images */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
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

            <form onSubmit={handleSubmit} className="p-6 pt-4">
              <div className="space-y-4">
                {/* Basic Information Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Basic Information
                  </h4>

                  {/* Name Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter category name"
                    />
                  </div>

                  {/* Description Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter category description"
                    />
                  </div>

                  {/* Parent Category Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent}
                      onChange={(e) =>
                        setFormData({ ...formData, parent: e.target.value })
                      }
                      className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="" className="dark:bg-gray-700">
                        None (Top Level)
                      </option>
                      {getAvailableParents().map((cat) => (
                        <option
                          key={cat._id}
                          value={cat._id}
                          className="dark:bg-gray-700"
                        >
                          {cat.name} {cat.level === 0 ? "(Parent)" : "(Child)"}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to make this a top-level category
                    </p>

                    {/* Level preview */}
                    {formData.parent ? (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          This will become a{" "}
                          <span className="font-semibold">sub-category</span> of{" "}
                          {
                            categories.find((c) => c._id === formData.parent)
                              ?.name
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          This will become a{" "}
                          <span className="font-semibold">
                            top-level category
                          </span>{" "}
                          with level 0
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Images & Icons
                  </h4>

                  {/* Category Image */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category Image
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage("image")}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                          onChange={(e) => handleImageUpload(e, "image")}
                          className="hidden"
                          id="edit-image-upload"
                        />
                        <label
                          htmlFor="edit-image-upload"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            "Change Image"
                          )}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                        className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Image alt text (for accessibility)"
                      />
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Banner Image (Optional)
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      {bannerPreview ? (
                        <div className="relative">
                          <img
                            src={bannerPreview}
                            alt="Banner Preview"
                            className="w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage("banner")}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                          onChange={(e) => handleImageUpload(e, "banner")}
                          className="hidden"
                          id="edit-banner-upload"
                        />
                        <label
                          htmlFor="edit-banner-upload"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition"
                        >
                          {uploadingBanner ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            "Change Banner"
                          )}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Recommended size: 1200x400px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Icon Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icon (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., 🎮, 📱, 💻"
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* SEO Settings Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    SEO Settings (Optional)
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaTitle: e.target.value,
                          })
                        }
                        className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="SEO title (defaults to category name)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="SEO description for search engines"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Settings Section */}
                <div className="pb-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Display Settings
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full text-black px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                            setFormData({
                              ...formData,
                              featured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Featured Category
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Active (Visible on site)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
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
