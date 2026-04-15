// pages/Products/EditProduct.tsx
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
  InformationCircleIcon,
  TagIcon,
  CurrencyDollarIcon,
  FireIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router";

// Category interface
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

// Brand interface
interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string;
  isPopular?: boolean;
  productCount?: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: any[];
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
  subCategory?: string;
  brand: string;
  mainImage: string;
  images: string[];
  stock: number;
  availability: "in-stock" | "out-of-stock" | "pre-order" | "coming-soon";
  type: "game" | "toy" | "accessory" | "console" | "board-game" | "card-game";
  platform: Array<
    | "PS5"
    | "PS4"
    | "Xbox Series X"
    | "Xbox Series S"
    | "Xbox One"
    | "Nintendo Switch"
    | "PC"
    | "Mobile"
    | "VR"
  >;
  genre: Array<
    | "Action"
    | "Adventure"
    | "RPG"
    | "Strategy"
    | "Racing"
    | "Sports"
    | "Shooter"
    | "Fighting"
    | "Puzzle"
    | "Simulation"
    | "Horror"
    | "Open World"
  >;
  ageRange: {
    min: number;
    max: number;
  };
  players: {
    min: number;
    max: number;
  };
  publisher: string;
  releaseDate: string;
  features: string[];
  specifications: Record<string, string>;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: "cm" | "inch" | "mm";
  };
  offerType:
    | "hot-deal"
    | "best-deal"
    | "special-offer"
    | "flash-sale"
    | "featured"
    | "none";
  offerBadge:
    | "Hot"
    | "Best Deal"
    | "Special"
    | "Sale"
    | "Limited"
    | "New"
    | "none";
  offerBadgeColor: "red" | "blue" | "green" | "orange" | "purple" | "yellow";
  offerPriority: number;
  isOnSale: boolean;
  discountPercentage: number;
  saleStartDate: string;
  saleEndDate: string;
  flashSaleQuantity: number;
  flashSaleSold: number;
  isFeatured: boolean;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  sku: string;
  rating: string;
  storageRequired: string;
  isActive?: boolean;
  brandName?: string;
}

interface ProductResponse {
  success: boolean;
  data: ProductFormData & { _id: string; createdAt: string; updatedAt: string };
}

// Tab configuration
interface Tab {
  id: string;
  name: string;
  icon: React.ReactNode;
  sections: string[];
}

export default function EditProduct() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

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
    brand: "",
    mainImage: "",
    images: [],
    stock: 0,
    availability: "in-stock",
    type: "game",
    platform: [],
    genre: [],
    ageRange: {
      min: 3,
      max: 99,
    },
    players: {
      min: 1,
      max: 1,
    },
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
    offerBadge: "none",
    offerBadgeColor: "red",
    offerPriority: 5,
    isOnSale: false,
    discountPercentage: 0,
    flashSaleQuantity: 0,
    flashSaleSold: 0,
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

  // Progress tracking
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(),
  );

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

  // Define tabs with icons and sections
  const tabs: Tab[] = [
    {
      id: "basic",
      name: "Basic Info",
      icon: <InformationCircleIcon className="w-5 h-5" />,
      sections: ["Basic Information", "Category Selection", "Brand Selection"],
    },
    {
      id: "pricing",
      name: "Pricing & Stock",
      icon: <CurrencyDollarIcon className="w-5 h-5" />,
      sections: ["Pricing & Stock"],
    },
    {
      id: "media",
      name: "Media",
      icon: <PhotoIcon className="w-5 h-5" />,
      sections: ["Images"],
    },
    {
      id: "details",
      name: "Product Details",
      icon: <TagIcon className="w-5 h-5" />,
      sections: [
        "Platforms & Genres",
        "Features",
        "Brand & Publisher",
        "Age Range & Players",
      ],
    },
    {
      id: "specs",
      name: "Specifications",
      icon: <ScaleIcon className="w-5 h-5" />,
      sections: ["Dimensions & Weight", "Rating", "Storage"],
    },
    {
      id: "offers",
      name: "Offers & Tags",
      icon: <FireIcon className="w-5 h-5" />,
      sections: ["Offer Settings", "Tags"],
    },
    {
      id: "seo",
      name: "SEO",
      icon: <ChartBarIcon className="w-5 h-5" />,
      sections: ["SEO Meta Data"],
    },
  ];

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Fetch categories from API
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
        const parents = data.data.filter((cat) => cat.level === 0);
        setParentCategories(parents);
        return data.data;
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
    return [];
  };

  // Fetch brands from API
  const fetchBrands = async () => {
    if (!token) return;

    setBrandsLoading(true);
    try {
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/brands",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data: ApiResponse = await response.json();

      if (data.success) {
        setBrands(data.data);
      } else {
        const publicResponse = await fetch(
          "https://gamersbd-server.onrender.com/api/brands",
        );
        const publicData: ApiResponse = await publicResponse.json();
        if (publicData.success) {
          setBrands(publicData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setBrandsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchBrands();
    }
  }, [token]);

  // Fetch product data - FIXED VERSION
  const fetchProduct = async () => {
    if (!token || !id) return;

    try {
      setFetchLoading(true);

      // Fetch product data
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data: ProductResponse = await response.json();

      if (data.success) {
        const product = data.data;

        // Ensure categories are loaded
        let currentCategories = categories;
        if (currentCategories.length === 0) {
          currentCategories = await fetchCategories();
        }

        // Get the category ID from product (handle both object and string)
        let productCategoryId = "";
        if (typeof product.category === "object" && product.category !== null) {
          productCategoryId =
            (product.category as any)._id || (product.category as any).id;
        } else if (typeof product.category === "string") {
          productCategoryId = product.category;
        }

        console.log("Product Category ID:", productCategoryId);
        console.log("Available Categories:", currentCategories);

        // Find the category object
        const categoryObj = currentCategories.find(
          (c) => c._id === productCategoryId,
        );

        let parentCategory = "";
        let subCategory = "";

        if (categoryObj) {
          if (categoryObj.level === 0) {
            // It's a parent category
            parentCategory = categoryObj._id;
            subCategory = "";
          } else if (categoryObj.level === 1 && categoryObj.parent) {
            // It's a subcategory
            parentCategory = categoryObj.parent._id;
            subCategory = categoryObj._id;
          }
        } else {
          // If category not found in list, try to use as is
          parentCategory = productCategoryId;
        }

        console.log("Setting Parent Category:", parentCategory);
        console.log("Setting Sub Category:", subCategory);

        // Load subcategories for the parent category
        if (parentCategory) {
          const children = currentCategories.filter(
            (cat) => cat.parent && cat.parent._id === parentCategory,
          );
          setSubCategories(children);
        }

        // Handle brand - extract ID from object if needed
        let brandId = "";
        if (product.brand) {
          if (typeof product.brand === "object" && product.brand !== null) {
            brandId =
              (product.brand as any)._id || (product.brand as any).id || "";
          } else if (typeof product.brand === "string") {
            brandId = product.brand;
          }
        }

        // Handle dates
        const formatDate = (date: any) => {
          if (!date) return "";
          return date.split("T")[0];
        };

        // Set form data with all values
        setFormData({
          name: product.name || "",
          description: product.description || "",
          shortDescription: product.shortDescription || "",
          price: Number(product.price) || 0,
          discountPrice: Number(product.discountPrice) || 0,
          currency: product.currency || "BDT",
          category: parentCategory,
          subCategory: subCategory,
          brand: brandId,
          mainImage: product.mainImage || "",
          images: product.images || [],
          stock: Number(product.stock) || 0,
          availability: product.availability || "in-stock",
          type: product.type || "game",
          platform: product.platform || [],
          genre: product.genre || [],
          ageRange: {
            min: Number(product.ageRange?.min) || 3,
            max: Number(product.ageRange?.max) || 99,
          },
          players: {
            min: Number(product.players?.min) || 1,
            max: Number(product.players?.max) || 1,
          },
          publisher: product.publisher || "",
          releaseDate: formatDate(product.releaseDate),
          features: product.features || [],
          specifications: product.specifications || {},
          weight: Number(product.weight) || 0,
          dimensions: {
            length: Number(product.dimensions?.length) || 0,
            width: Number(product.dimensions?.width) || 0,
            height: Number(product.dimensions?.height) || 0,
            unit: product.dimensions?.unit || "cm",
          },
          offerType: product.offerType || "none",
          offerBadge: product.offerBadge || "none",
          offerBadgeColor: product.offerBadgeColor || "red",
          offerPriority: Number(product.offerPriority) || 5,
          isOnSale: product.isOnSale || false,
          discountPercentage: Number(product.discountPercentage) || 0,
          flashSaleQuantity: Number(product.flashSaleQuantity) || 0,
          flashSaleSold: Number(product.flashSaleSold) || 0,
          saleStartDate: product.saleStartDate
            ? formatDate(product.saleStartDate)
            : "",
          saleEndDate: product.saleEndDate
            ? formatDate(product.saleEndDate)
            : "",
          isFeatured: product.isFeatured || false,
          tags: product.tags || [],
          metaTitle: product.metaTitle || "",
          metaDescription: product.metaDescription || "",
          metaKeywords: product.metaKeywords || [],
          sku: product.sku || "",
          rating: product.rating || "",
          storageRequired: product.storageRequired || "",
        });
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product data");
    } finally {
      setFetchLoading(false);
    }
  };

  // Load product when categories are ready
  useEffect(() => {
    if (token && id) {
      const loadData = async () => {
        if (categories.length > 0) {
          await fetchProduct();
        } else {
          // Wait for categories to load
          const interval = setInterval(async () => {
            if (categories.length > 0) {
              clearInterval(interval);
              await fetchProduct();
            }
          }, 100);
          return () => clearInterval(interval);
        }
      };
      loadData();
    }
  }, [token, id, categories.length]);

  // Update subcategories when main category changes
  useEffect(() => {
    if (formData.category) {
      const children = categories.filter(
        (cat) => cat.parent && cat.parent._id === formData.category,
      );
      setSubCategories(children);
    } else {
      setSubCategories([]);
    }
  }, [formData.category, categories]);

  // Update completed sections
  useEffect(() => {
    const completed = new Set<string>();

    if (formData.name && formData.sku && formData.type)
      completed.add("Basic Information");
    if (formData.category) completed.add("Category Selection");
    if (formData.brand) completed.add("Brand Selection");
    if (formData.price > 0) completed.add("Pricing & Stock");
    if (formData.mainImage) completed.add("Images");
    if (formData.platform.length > 0) completed.add("Platforms & Genres");
    if (formData.features.length > 0) completed.add("Features");
    if (formData.publisher) completed.add("Brand & Publisher");
    if (formData.ageRange.min > 0) completed.add("Age Range & Players");
    if (formData.weight > 0) completed.add("Dimensions & Weight");
    if (formData.rating) completed.add("Rating");
    if (formData.storageRequired) completed.add("Storage");
    if (formData.offerType !== "none") completed.add("Offer Settings");
    if (formData.tags.length > 0) completed.add("Tags");
    if (formData.metaTitle && formData.metaDescription)
      completed.add("SEO Meta Data");

    setCompletedSections(completed);
  }, [formData]);

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
    const numValue = value === "" ? 0 : parseFloat(value);

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProductFormData] as Record<string, any>),
          [child]: numValue,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  // Add item to array
  const addToArray = (
    field: "platform" | "genre" | "features" | "tags" | "metaKeywords",
    value: string,
  ) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()],
      }));

      if (field === "platform") setPlatformInput("");
      if (field === "genre") setGenreInput("");
      if (field === "features") setFeatureInput("");
      if (field === "tags") setTagInput("");
      if (field === "metaKeywords") setKeywordInput("");
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

  // Handle brand selection
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    const selectedBrand = brands.find((b) => b._id === brandId);
    setFormData((prev) => ({
      ...prev,
      brand: brandId,
      brandName: selectedBrand?.name,
    }));
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/all-products");
  };

  // Handle form submission - FIXED: Removed discount validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission
      const productData = {
        ...formData,
        category: formData.subCategory || formData.category,
        subCategory: undefined,
        brandName: undefined,
        // Ensure numeric values are numbers
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice),
        stock: Number(formData.stock),
        weight: Number(formData.weight),
        discountPercentage: Number(formData.discountPercentage),
        offerPriority: Number(formData.offerPriority),
        flashSaleQuantity: Number(formData.flashSaleQuantity),
        flashSaleSold: Number(formData.flashSaleSold),
        ageRange: {
          min: Number(formData.ageRange.min),
          max: Number(formData.ageRange.max),
        },
        players: {
          min: Number(formData.players.min),
          max: Number(formData.players.max),
        },
        dimensions: {
          length: Number(formData.dimensions.length),
          width: Number(formData.dimensions.width),
          height: Number(formData.dimensions.height),
          unit: formData.dimensions.unit,
        },
      };

      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      showToast("Product updated successfully!", "success");
      setSuccess(true);

      setTimeout(() => {
        navigate("/all-products");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update product";
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

  // Get brand name by ID
  const getBrandName = (id: string) => {
    const brand = brands.find((b) => b._id === id);
    return brand ? brand.name : "";
  };

  // Calculate progress percentage
  const totalSections = 14;
  const progressPercentage = (completedSections.size / totalSections) * 100;

  // Render section with completion indicator
  const renderSection = (
    title: string,
    content: React.ReactNode,
    required: boolean = false,
  ) => {
    const isCompleted = completedSections.has(title);

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
          isCompleted
            ? "border-green-300 dark:border-green-700"
            : "border-gray-200 dark:border-gray-700"
        } p-6 transition-all hover:shadow-md`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {title}
            {required && <span className="text-red-500 text-sm">*</span>}
          </h2>
          {isCompleted && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckIcon className="w-4 h-4 mr-1" />
              Completed
            </span>
          )}
        </div>
        {content}
      </div>
    );
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Edit Product | GamersBD Admin"
        description="Edit product"
      />
      <PageBreadcrumb pageTitle="Edit Product" />

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
            Product updated successfully! Redirecting to products list...
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
              <ShoppingBagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Edit Product: {formData.name}
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Completion Progress
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {completedSections.size}/{totalSections} sections completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
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
                Edit Product
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 sticky top-4">
            {tabs.map((tab) => {
              const hasCompletedSection = tab.sections.some((s) =>
                completedSections.has(s),
              );
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span
                    className={
                      activeTab === tab.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  >
                    {tab.icon}
                  </span>
                  <span className="flex-1 text-left">{tab.name}</span>
                  {hasCompletedSection && (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <>
                {renderSection(
                  "Basic Information",
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <option value="toy">Toy</option>
                        <option value="accessory">Accessory</option>
                        <option value="console">Console</option>
                        <option value="board-game">Board Game</option>
                        <option value="card-game">Card Game</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="shortDescription">
                        Short Description
                      </Label>
                      <Input
                        type="text"
                        id="shortDescription"
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleChange}
                        placeholder="Brief description (max 200 characters)"
                      />
                    </div>

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
                  </div>,
                  true,
                )}

                {renderSection(
                  "Category Selection",
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subCategory">
                        Sub Category (Optional)
                      </Label>
                      <select
                        id="subCategory"
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        disabled={
                          !formData.category || subCategories.length === 0
                        }
                      >
                        <option value="">Select a subcategory</option>
                        {subCategories.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(formData.category || formData.subCategory) && (
                      <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
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
                  </div>,
                  true,
                )}

                {renderSection(
                  "Brand Selection",
                  <div>
                    <Label htmlFor="brand">
                      Brand <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleBrandChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      required
                      disabled={brandsLoading}
                    >
                      <option value="">
                        {brandsLoading ? "Loading brands..." : "Select a brand"}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name} {brand.isPopular ? "⭐" : ""}{" "}
                          {brand.productCount
                            ? `(${brand.productCount} products)`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {formData.brand && (
                      <div className="mt-2 flex items-center gap-2">
                        {brands.find((b) => b._id === formData.brand)?.logo && (
                          <img
                            src={
                              brands.find((b) => b._id === formData.brand)
                                ?.logo || ""
                            }
                            alt="Brand logo"
                            className="w-8 h-8 object-contain rounded"
                          />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Selected: {getBrandName(formData.brand)}
                        </span>
                      </div>
                    )}
                  </div>,
                  true,
                )}
              </>
            )}

            {/* Pricing Tab - FIXED: Removed discount validation */}
            {activeTab === "pricing" && (
              <>
                {renderSection(
                  "Pricing & Stock",
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          step={0.01}
                          required
                        />
                      </div>

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
                          <option value="coming-soon">Coming Soon</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isOnSale"
                          name="isOnSale"
                          checked={formData.isOnSale}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label htmlFor="isOnSale">
                          This product is on sale
                        </Label>
                      </div>
                    </div>

                    {formData.isOnSale && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
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
                            step={0.01}
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
                            step={1}
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
                  </div>,
                  true,
                )}
              </>
            )}

            {/* Media Tab */}
            {activeTab === "media" && (
              <>
                {renderSection(
                  "Images",
                  <div className="space-y-6">
                    {/* Main Image */}
                    <div>
                      <Label>
                        Main Image <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <input
                            type="file"
                            id="mainImageUpload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  showToast(
                                    "Image size should be less than 5MB",
                                    "error",
                                  );
                                  return;
                                }
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
                              {formData.mainImage
                                ? "Change main image"
                                : "Click to upload main image"}
                            </span>
                          </label>
                        </div>

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
                                setFormData((prev) => ({
                                  ...prev,
                                  mainImage: "",
                                }))
                              }
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Images */}
                    <div>
                      <Label>Additional Images (Up to 5)</Label>
                      <div className="flex flex-col gap-3">
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
                              if (formData.images.length + files.length > 5) {
                                showToast(
                                  "You can only upload up to 5 additional images.",
                                  "error",
                                );
                                return;
                              }
                              for (const file of files) {
                                if (file.size > 5 * 1024 * 1024) {
                                  showToast(
                                    `Image ${file.name} is too large. Max 5MB`,
                                    "error",
                                  );
                                  continue;
                                }
                                const reader = new FileReader();
                                await new Promise((resolve) => {
                                  reader.onloadend = () => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      images: [
                                        ...prev.images,
                                        reader.result as string,
                                      ],
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

                        {formData.images.length > 0 && (
                          <>
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
                                    onClick={() =>
                                      removeFromArray("images", index)
                                    }
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg opacity-0 group-hover:opacity-100"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              {formData.images.length} of 5 images uploaded
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>,
                  true,
                )}
              </>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <>
                {renderSection(
                  "Platforms & Genres",
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={platformInput}
                          onChange={(e) => setPlatformInput(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select platform</option>
                          <option value="PS5">PS5</option>
                          <option value="PS4">PS4</option>
                          <option value="Xbox Series X">Xbox Series X</option>
                          <option value="Xbox Series S">Xbox Series S</option>
                          <option value="Xbox One">Xbox One</option>
                          <option value="Nintendo Switch">
                            Nintendo Switch
                          </option>
                          <option value="PC">PC</option>
                          <option value="Mobile">Mobile</option>
                          <option value="VR">VR</option>
                        </select>
                        <Button
                          type="button"
                          onClick={() => addToArray("platform", platformInput)}
                          disabled={!platformInput}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Genres</Label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={genreInput}
                          onChange={(e) => setGenreInput(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select genre</option>
                          <option value="Action">Action</option>
                          <option value="Adventure">Adventure</option>
                          <option value="RPG">RPG</option>
                          <option value="Strategy">Strategy</option>
                          <option value="Racing">Racing</option>
                          <option value="Sports">Sports</option>
                          <option value="Shooter">Shooter</option>
                          <option value="Fighting">Fighting</option>
                          <option value="Puzzle">Puzzle</option>
                          <option value="Simulation">Simulation</option>
                          <option value="Horror">Horror</option>
                          <option value="Open World">Open World</option>
                        </select>
                        <Button
                          type="button"
                          onClick={() => addToArray("genre", genreInput)}
                          disabled={!genreInput}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>,
                )}

                {renderSection(
                  "Features",
                  <div>
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
                        disabled={!featureInput}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>,
                )}

                {renderSection(
                  "Brand & Publisher",
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  </div>,
                )}

                {renderSection(
                  "Age Range & Players",
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
                          max="18"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          name="ageRange.max"
                          value={formData.ageRange.max}
                          onChange={handleNumberChange}
                          placeholder="Max age"
                          min="3"
                          max="99"
                          className="flex-1"
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
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          name="players.max"
                          value={formData.players.max}
                          onChange={handleNumberChange}
                          placeholder="Max players"
                          min="1"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>,
                )}
              </>
            )}

            {/* Specifications Tab */}
            {activeTab === "specs" && (
              <>
                {renderSection(
                  "Dimensions & Weight",
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label>Dimensions (L x W x H)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            name="dimensions.length"
                            value={formData.dimensions.length}
                            onChange={handleNumberChange}
                            placeholder="L"
                            step={0.1}
                          />
                          <Input
                            type="number"
                            name="dimensions.width"
                            value={formData.dimensions.width}
                            onChange={handleNumberChange}
                            placeholder="W"
                            step={0.1}
                          />
                          <Input
                            type="number"
                            name="dimensions.height"
                            value={formData.dimensions.height}
                            onChange={handleNumberChange}
                            placeholder="H"
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
                          <option value="inch">Inches (inch)</option>
                          <option value="mm">Millimeters (mm)</option>
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
                    </div>
                  </div>,
                )}

                {renderSection(
                  "Rating",
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
                  </div>,
                )}

                {renderSection(
                  "Storage",
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
                  </div>,
                )}
              </>
            )}

            {/* Offers Tab */}
            {activeTab === "offers" && (
              <>
                {renderSection(
                  "Offer Settings",
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
                        <option value="best-deal">Best Deal</option>
                        <option value="special-offer">Special Offer</option>
                        <option value="flash-sale">Flash Sale</option>
                        <option value="featured">Featured</option>
                      </select>
                    </div>

                    {formData.offerType !== "none" && (
                      <>
                        <div>
                          <Label htmlFor="offerBadge">Badge Text</Label>
                          <select
                            id="offerBadge"
                            name="offerBadge"
                            value={formData.offerBadge}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          >
                            <option value="none">None</option>
                            <option value="Hot">Hot</option>
                            <option value="Best Deal">Best Deal</option>
                            <option value="Special">Special</option>
                            <option value="Sale">Sale</option>
                            <option value="Limited">Limited</option>
                            <option value="New">New</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="offerBadgeColor">Badge Color</Label>
                          <select
                            id="offerBadgeColor"
                            name="offerBadgeColor"
                            value={formData.offerBadgeColor}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          >
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="orange">Orange</option>
                            <option value="purple">Purple</option>
                            <option value="yellow">Yellow</option>
                          </select>
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

                        {/* Flash Sale Fields */}
                        {formData.offerType === "flash-sale" && (
                          <div className="col-span-2 grid grid-cols-2 gap-4 mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div>
                              <Label htmlFor="flashSaleQuantity">
                                Flash Sale Quantity
                              </Label>
                              <Input
                                type="number"
                                id="flashSaleQuantity"
                                name="flashSaleQuantity"
                                value={formData.flashSaleQuantity}
                                onChange={handleNumberChange}
                                min="0"
                              />
                            </div>
                            <div>
                              <Label htmlFor="flashSaleSold">
                                Already Sold
                              </Label>
                              <Input
                                type="number"
                                id="flashSaleSold"
                                name="flashSaleSold"
                                value={formData.flashSaleSold}
                                onChange={handleNumberChange}
                                min="0"
                                disabled
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>,
                )}

                {renderSection(
                  "Tags",
                  <div>
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
                        disabled={!tagInput}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>,
                )}
              </>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <>
                {renderSection(
                  "SEO Meta Data",
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
                          onClick={() =>
                            addToArray("metaKeywords", keywordInput)
                          }
                          disabled={!keywordInput}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
                              onClick={() =>
                                removeFromArray("metaKeywords", index)
                              }
                              className="text-green-600 dark:text-green-400 hover:text-green-800"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>,
                )}

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
                    <Label htmlFor="isFeatured">
                      Feature this product on homepage
                    </Label>
                  </div>
                </div>
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
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
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
