// pages/Products/Products.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  ChevronUpDownIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, TrashBinIcon, EyeIcon, PlusIcon } from "../../icons";
import { Link, useNavigate } from "react-router";
import DeleteProductModal from "./DeleteProductModal";

// Product interface based on your API response
interface Product {
  _id: string;
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  finalPrice: number;
  currency: string;
  mainImage: string;
  images: string[];
  stock: number;
  availability: "in-stock" | "out-of-stock" | "pre-order";
  type: string;
  platform: string[];
  genre: string[];
  brand: string;
  publisher: string;
  releaseDate: string;
  rating: string;
  isFeatured: boolean;
  isActive: boolean;
  isOnSale: boolean;
  discountPercentage: number;
  offerType: string;
  offerBadge: string;
  offerBadgeColor: string;
  sku: string;
  tags: string[];
  views: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
  ageRange: {
    min: number;
    max: number;
  };
  players: {
    min: number;
    max: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weight: number;
  storageRequired: string;
  features: string[];
  specifications: Record<string, any>;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  isDealActive: boolean;
  offerDisplay: {
    type: string;
    badge: string;
    color: string;
    priority: number;
  } | null;
}

interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Product[];
}

export default function Products() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<keyof Product>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // In your Products.tsx
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null as string | null,
    productName: "",
  });

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

  // Fetch products
  const fetchProducts = async () => {
    if (!token) {
      setError("No authentication token found");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: `${sortField}:${sortDirection}`,
      });

      if (search) {
        queryParams.append("search", search);
      }
      if (platformFilter !== "all") {
        queryParams.append("platform", platformFilter);
      }
      if (typeFilter !== "all") {
        queryParams.append("type", typeFilter);
      }
      if (availabilityFilter !== "all") {
        queryParams.append("availability", availabilityFilter);
      }

      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/products?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data: ProductsResponse = await response.json();
      console.log("Products fetched:", data);

      if (!response.ok) {
        throw new Error(
          data.success === false
            ? (data as any).message
            : "Failed to fetch products",
        );
      }

      setProducts(data.data);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    token,
    currentPage,
    sortField,
    sortDirection,
    platformFilter,
    typeFilter,
    availabilityFilter,
    search,
  ]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle sort
  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format price
  const formatPrice = (price: number, currency: string = "BDT") => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      productId: product._id,
      productName: product.name,
    });
  };
  const confirmDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/products/${deleteModal.productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete");

      // Remove from local state
      setProducts(products.filter((p) => p._id !== deleteModal.productId));
      showToast("Product deleted successfully", "success");
      setDeleteModal({ isOpen: false, productId: null, productName: "" });
    } catch (error) {
      showToast("Failed to delete product", "error");
    }
  };
  // Get all unique platforms for filter
  const allPlatforms = [...new Set(products.flatMap((p) => p.platform))];

  // Get all unique types for filter
  const allTypes = [...new Set(products.map((p) => p.type))];

  // Sort Icon Component
  const SortIcon = ({ field }: { field: keyof Product }) => {
    if (sortField !== field) {
      return <ChevronUpDownIcon className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };
  console.log(products, "products in render");
  if (loading && products.length === 0) {
    return (
      <>
        <PageMeta
          title="Products | GamersBD Admin"
          description="Manage products"
        />
        <PageBreadcrumb pageTitle="Products" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Products | GamersBD Admin"
        description="Manage products"
      />
      <PageBreadcrumb pageTitle="Products" />

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transition-all transform animate-slide-in ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Products
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalItems}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {products.filter((p) => p.availability === "in-stock").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">On Sale</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {products.filter((p) => p.isOnSale).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {products.filter((p) => p.isFeatured).length}
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, description, or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Link
                  to="/products/add"
                  className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
                >
                  <DocumentPlusIcon className="w-4 h-4 mr-2" /> Add Products
                </Link>
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Platforms</option>
                {allPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                {allTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Availability</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="pre-order">Pre-Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Brand
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      Price
                      <SortIcon field="price" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort("soldCount")}
                  >
                    <div className="flex items-center">
                      Sold
                      <SortIcon field="soldCount" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Added
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                            {product.mainImage && (
                              <img
                                src={product.mainImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/48?text=No+Image";
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </div>
                            {product.offerDisplay && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1"
                                style={{
                                  backgroundColor: `${product.offerBadgeColor}20`,
                                  color: product.offerBadgeColor,
                                }}
                              >
                                {product.offerBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {(product.brand as any)?.name ||
                              product.brand ||
                              "-"}
                          </div>
                        </td>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {product.isOnSale ? (
                            <>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {formatPrice(
                                  product.finalPrice,
                                  product.currency,
                                )}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 line-through ml-2">
                                {formatPrice(product.price, product.currency)}
                              </span>
                              <span className="text-xs text-green-600 dark:text-green-400 block">
                                -{product.discountPercentage}%
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-900 dark:text-white font-medium">
                              {formatPrice(product.price, product.currency)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.platform.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span
                            className={`font-medium ${
                              product.stock > 10
                                ? "text-green-600 dark:text-green-400"
                                : product.stock > 0
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {product.stock}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            units
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.availability === "in-stock" && "In Stock"}
                          {product.availability === "out-of-stock" &&
                            "Out of Stock"}
                          {product.availability === "pre-order" && "Pre-Order"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.soldCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {product.isFeatured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Featured
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              console.log("View product", product._id)
                            }
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50 rounded-full transition"
                            title="View product"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/edit-product/${product._id}`)
                            }
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition"
                            title="Delete product"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          No products found
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Add the Delete Modal at the end of your component, before the closing fragment */}
        <DeleteProductModal
          isOpen={deleteModal.isOpen}
          productName={deleteModal.productName}
          onClose={() =>
            setDeleteModal({ isOpen: false, productId: null, productName: "" })
          }
          onConfirm={confirmDelete}
        />
      </div>
    </>
  );
}
