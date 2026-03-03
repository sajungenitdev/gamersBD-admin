// pages/Products/AddProduct.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  XMarkIcon,
  PlusIcon,
  HomeIcon,
  ArrowLeftIcon,
  CheckIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";

// Category interface matching your API response
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

interface ApiResponse {
  success: boolean;
  count: number;
  data: Category[];
}

// Product interface for form data
interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  currency: string;
  category: string;
  subCategory: string;
  mainImage: string;
  images: string[];
  stock: number;
  availability: "in-stock" | "out-of-stock" | "pre-order";
  type: string;
  platform: string[];
  genre: string[];
  ageRange: {
    min: number;
    max: number;
  };
  players: {
    min: number;
    max: number;
  };
  brand: string;
  publisher: string;
  releaseDate: string;
  features: string[];
  specifications: Record<string, string>;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  offerType: "none" | "hot-deal" | "new-arrival" | "best-seller";
  offerBadge: string;
  offerBadgeColor: string;
  offerPriority: number;
  isOnSale: boolean;
  discountPercentage: number;
  saleStartDate: string;
  saleEndDate: string;
  isFeatured: boolean;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  sku: string;
  rating: string;
  storageRequired: string;
}

export default function AddProduct() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    discountPrice: 0,
    currency: "BDT",
    category: "",
    subCategory: "",
    mainImage: "",
    images: [],
    stock: 0,
    availability: "in-stock",
    type: "game",
    platform: [],
    genre: [],
    ageRange: {
      min: 0,
      max: 0,
    },
    players: {
      min: 1,
      max: 1,
    },
    brand: "",
    publisher: "",
    releaseDate: "",
    features: [],
    specifications: {},
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: "cm",
    },
    offerType: "none",
    offerBadge: "",
    offerBadgeColor: "red",
    offerPriority: 5,
    isOnSale: false,
    discountPercentage: 0,
    saleStartDate: "",
    saleEndDate: "",
    isFeatured: false,
    tags: [],
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    sku: "",
    rating: "",
    storageRequired: "",
  });

  // Input field states for arrays
  const [platformInput, setPlatformInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  console.log(imageInput);
  // Toast notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Fetch categories from API (same as AllCategories component)
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data: ApiResponse = await response.json();

      if (data.success) {
        setCategories(data.data);
        console.log("Fetched categories:", data.data); // Debug log

        // Filter parent categories (level 0)
        const parents = data.data.filter((cat) => cat.level === 0);
        setParentCategories(parents);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Error connecting to server");
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  // Update subcategories when main category changes
  useEffect(() => {
    if (formData.category) {
      // Find children of selected parent category
      const children = categories.filter(
        (cat) => cat.parent && cat.parent._id === formData.category,
      );
      setSubCategories(children);

      // Reset subcategory when parent changes
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    } else {
      setSubCategories([]);
    }
  }, [formData.category, categories]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name.includes(".")) {
      // Handle nested objects
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProductFormData] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Add item to array
  const addToArray = (
    field:
      | "platform"
      | "genre"
      | "features"
      | "tags"
      | "metaKeywords"
      | "images",
    value: string,
  ) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()],
      }));

      // Clear input
      if (field === "platform") setPlatformInput("");
      if (field === "genre") setGenreInput("");
      if (field === "features") setFeatureInput("");
      if (field === "tags") setTagInput("");
      if (field === "metaKeywords") setKeywordInput("");
      if (field === "images") setImageInput("");
    }
  };

  // Remove item from array
  const removeFromArray = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof ProductFormData] as any[]).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/all-products");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare final data - use subCategory if selected, otherwise use category
      const productData = {
        ...formData,
        category: formData.subCategory || formData.category,
        subCategory: undefined, // Remove subCategory from final payload
      };

      console.log("Submitting product:", productData);

      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      showToast("Product created successfully!", "success");
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate("/products");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create product";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Get category name by ID
  const getCategoryName = (id: string) => {
    const category = categories.find((cat) => cat._id === id);
    return category ? category.name : "";
  };

  return (
    <>
      <PageMeta
        title="Add Product | GamersBD Admin"
        description="Add new product"
      />
      <PageBreadcrumb pageTitle="Add Product" />

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transition-all transform animate-slide-in ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300 font-medium">
            Product created successfully! Redirecting to products list...
          </p>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Products</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                ➕
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Add New Product
            </h1>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-sm"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center flex-wrap gap-2">
            <li>
              <a
                href="/dashboard"
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <HomeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </a>
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <a
                href="/products"
                className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Products
              </a>
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span
                className="ml-2 text-gray-700 dark:text-gray-300 font-medium"
                aria-current="page"
              >
                Add New Product
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-2">
              <Label htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <Label htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Enter SKU"
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Product Type</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="game">Game</option>
                <option value="console">Console</option>
                <option value="accessory">Accessory</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>

            {/* Short Description */}
            <div className="col-span-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Brief description (max 200 characters)"
              />
            </div>

            {/* Full Description */}
            <div className="col-span-2">
              <Label htmlFor="description">Full Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter full product description"
              />
            </div>
          </div>
        </div>

        {/* Category Selection - Using the same logic as AllCategories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Selection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parent Category (Level 0) */}
            <div>
              <Label htmlFor="category">
                Parent Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">Select a parent category</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}{" "}
                    {cat.description
                      ? `- ${cat.description.substring(0, 30)}...`
                      : ""}
                  </option>
                ))}
              </select>
              {formData.category && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Selected: {getCategoryName(formData.category)}
                </p>
              )}
            </div>

            {/* Sub Category (Level 1) */}
            <div>
              <Label htmlFor="subCategory">Sub Category (Optional)</Label>
              <select
                id="subCategory"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={!formData.category || subCategories.length === 0}
              >
                <option value="">Select a subcategory</option>
                {subCategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}{" "}
                    {sub.description
                      ? `- ${sub.description.substring(0, 30)}...`
                      : ""}
                  </option>
                ))}
              </select>
              {subCategories.length === 0 && formData.category && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No subcategories available for this parent category
                </p>
              )}
            </div>
          </div>

          {/* Selected Category Display */}
          {(formData.category || formData.subCategory) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Selected: </span>
                {formData.subCategory ? (
                  <>
                    <span className="text-blue-600 dark:text-blue-400">
                      {getCategoryName(formData.category)}
                    </span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600 dark:text-green-400">
                      {getCategoryName(formData.subCategory)}
                    </span>
                  </>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400">
                    {getCategoryName(formData.category)}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Rest of the form remains the same... */}
        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pricing & Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price */}
            <div>
              <Label htmlFor="price">
                Regular Price <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleNumberChange}
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Stock */}
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleNumberChange}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Availability */}
            <div>
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="pre-order">Pre-Order</option>
              </select>
            </div>

            {/* On Sale Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnSale"
                name="isOnSale"
                checked={formData.isOnSale}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isOnSale">This product is on sale</Label>
            </div>
          </div>

          {/* Sale Fields */}
          {formData.isOnSale && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="discountPrice">Discount Price</Label>
                <Input
                  type="number"
                  id="discountPrice"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleNumberChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="discountPercentage">Discount %</Label>
                <Input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleNumberChange}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="saleStartDate">Sale Start</Label>
                <Input
                  type="date"
                  id="saleStartDate"
                  name="saleStartDate"
                  value={formData.saleStartDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="saleEndDate">Sale End</Label>
                <Input
                  type="date"
                  id="saleEndDate"
                  name="saleEndDate"
                  value={formData.saleEndDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Platforms & Genres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platforms & Genres
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platforms */}
            <div>
              <Label>Platforms</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value)}
                  placeholder="Add platform (e.g., PS5, Xbox)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addToArray("platform", platformInput)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.platform.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFromArray("platform", index)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <Label>Genres</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Add genre"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addToArray("genre", genreInput)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.genre.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFromArray("genre", index)}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Images
          </h2>

          {/* Main Image */}
          <div className="mb-6">
            <Label>Main Image</Label>
            <div className="flex flex-col gap-3">
              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  id="mainImageUpload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (limit to 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        showToast(
                          "Image size should be less than 5MB",
                          "error",
                        );
                        return;
                      }

                      // Convert to base64
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData((prev) => ({
                          ...prev,
                          mainImage: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label
                  htmlFor="mainImageUpload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                >
                  <PhotoIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                    Click to upload main image
                  </span>
                </label>
              </div>

              {/* Image Preview with Remove Option */}
              {formData.mainImage && (
                <div className="relative inline-block">
                  <div className="w-32 h-32 border-2 border-blue-500 rounded-lg overflow-hidden">
                    <img
                      src={formData.mainImage}
                      alt="Main preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, mainImage: "" }))
                    }
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg"
                    title="Remove image"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/50 text-white py-1 rounded-b-lg">
                    Main Image
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Images */}
          <div>
            <Label>Additional Images (Up to 5)</Label>
            <div className="flex flex-col gap-3">
              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  id="additionalImagesUpload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={formData.images.length >= 5}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);

                    // Check if adding these files would exceed limit
                    if (formData.images.length + files.length > 5) {
                      showToast(
                        `You can only upload up to 5 additional images. You have ${formData.images.length} already.`,
                        "error",
                      );
                      return;
                    }

                    // Process each file
                    for (const file of files) {
                      // Check file size
                      if (file.size > 5 * 1024 * 1024) {
                        showToast(
                          `Image ${file.name} is too large. Max 5MB`,
                          "error",
                        );
                        continue;
                      }

                      // Check file type
                      if (!file.type.startsWith("image/")) {
                        showToast(`File ${file.name} is not an image`, "error");
                        continue;
                      }

                      // Convert to base64
                      const reader = new FileReader();
                      await new Promise((resolve) => {
                        reader.onloadend = () => {
                          setFormData((prev) => ({
                            ...prev,
                            images: [...prev.images, reader.result as string],
                          }));
                          resolve(null);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                />
                <label
                  htmlFor="additionalImagesUpload"
                  className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors group ${
                    formData.images.length >= 5
                      ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
                  }`}
                >
                  <PhotoIcon
                    className={`w-6 h-6 ${
                      formData.images.length >= 5
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      formData.images.length >= 5
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                    }`}
                  >
                    {formData.images.length >= 5
                      ? "Maximum 5 images reached"
                      : `Click to upload additional images (${formData.images.length}/5)`}
                  </span>
                </label>
              </div>

              {/* Image Previews Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromArray("images", index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg opacity-0 group-hover:opacity-100"
                        title="Remove image"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/50 text-white py-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
                        Image {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Counter */}
              {formData.images.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {formData.images.length} of 5 images uploaded
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Features
          </h2>

          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addToArray("features", featureInput)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          <ul className="list-disc list-inside space-y-1">
            {formData.features.map((feature, index) => (
              <li
                key={index}
                className="text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFromArray("features", index)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand & Publisher */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Brand & Publisher
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                type="text"
                id="publisher"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                placeholder="Enter publisher name"
              />
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                type="date"
                id="releaseDate"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Age Range & Players */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Age Range & Players
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Age Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="ageRange.min"
                  value={formData.ageRange.min}
                  onChange={handleNumberChange}
                  placeholder="Min age"
                  min="0"
                />
                <Input
                  type="number"
                  name="ageRange.max"
                  value={formData.ageRange.max}
                  onChange={handleNumberChange}
                  placeholder="Max age"
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label>Players</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="players.min"
                  value={formData.players.min}
                  onChange={handleNumberChange}
                  placeholder="Min players"
                  min="1"
                />
                <Input
                  type="number"
                  name="players.max"
                  value={formData.players.max}
                  onChange={handleNumberChange}
                  placeholder="Max players"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions & Weight */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Dimensions & Weight
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Dimensions (L x W x H)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleNumberChange}
                  placeholder="Length"
                  step={0.1}
                />
                <Input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleNumberChange}
                  placeholder="Width"
                  step={0.1}
                />
                <Input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleNumberChange}
                  placeholder="Height"
                  step={0.1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dimensions.unit">Unit</Label>
              <select
                name="dimensions.unit"
                value={formData.dimensions.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="weight">Weight (g)</Label>
              <Input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleNumberChange}
                placeholder="Weight in grams"
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="storageRequired">Storage Required</Label>
              <Input
                type="text"
                id="storageRequired"
                name="storageRequired"
                value={formData.storageRequired}
                onChange={handleChange}
                placeholder="e.g., 90 GB"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rating
          </h2>

          <div>
            <Label htmlFor="rating">Rating (e.g., PEGI 16, E, M)</Label>
            <Input
              type="text"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="Enter rating"
            />
          </div>
        </div>

        {/* Offer Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Offer Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="offerType">Offer Type</Label>
              <select
                id="offerType"
                name="offerType"
                value={formData.offerType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="none">None</option>
                <option value="hot-deal">Hot Deal</option>
                <option value="new-arrival">New Arrival</option>
                <option value="best-seller">Best Seller</option>
              </select>
            </div>

            {formData.offerType !== "none" && (
              <>
                <div>
                  <Label htmlFor="offerBadge">Badge Text</Label>
                  <Input
                    type="text"
                    id="offerBadge"
                    name="offerBadge"
                    value={formData.offerBadge}
                    onChange={handleChange}
                    placeholder="e.g., Hot, New, Bestseller"
                  />
                </div>
                <div>
                  <Label htmlFor="offerBadgeColor">Badge Color</Label>
                  <Input
                    type="color"
                    id="offerBadgeColor"
                    name="offerBadgeColor"
                    value={formData.offerBadgeColor}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="offerPriority">Priority (1-10)</Label>
                  <Input
                    type="number"
                    id="offerPriority"
                    name="offerPriority"
                    value={formData.offerPriority}
                    onChange={handleNumberChange}
                    min="1"
                    max="10"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tags
          </h2>

          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addToArray("tags", tagInput)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeFromArray("tags", index)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured Checkbox */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isFeatured">Feature this product on homepage</Label>
          </div>
        </div>

        {/* SEO Meta Data */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            SEO Meta Data
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                type="text"
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                placeholder="SEO title"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="SEO description"
              />
            </div>
            <div>
              <Label>Meta Keywords</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addToArray("metaKeywords", keywordInput)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.metaKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeFromArray("metaKeywords", index)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </>
  );
}
