import React, { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  HomeIcon,
  PlusIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import EditCategoryModal from "../../components/categories/EditCategoryModal";
import AddCategoryModal from "../../components/categories/AddCategoryModal";
import DeleteCategoryModal from "../../components/categories/DeleteCategoryModal";

// Type definitions
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

// Sort configuration type
interface SortConfig {
  key: keyof Category | "parentName" | null;
  direction: "asc" | "desc" | null;
}

const AllCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showHierarchy, setShowHierarchy] = useState<boolean>(false);

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  const [addModal, setAddModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
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

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://gamersbd-server.onrender.com/api/categories");
      const data: ApiResponse = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // 🔍 Filtered Data
  const filteredData = useMemo(() => {
    let filtered = [...categories];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(search.toLowerCase())) ||
          (item.parent?.name &&
            item.parent.name.toLowerCase().includes(search.toLowerCase())),
      );
    }

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.level === parseInt(levelFilter),
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Category];
        let bValue: any = b[sortConfig.key as keyof Category];

        if (sortConfig.key === "parentName") {
          aValue = a.parent?.name || "";
          bValue = b.parent?.name || "";
        }

        if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // Hierarchy view
    if (showHierarchy && !sortConfig.key) {
      filtered.sort((a, b) => {
        if (!a.parent && b.parent) return -1;
        if (a.parent && !b.parent) return 1;
        if (a.parent && b.parent) {
          if (a.parent.name < b.parent.name) return -1;
          if (a.parent.name > b.parent.name) return 1;
        }
        return a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }, [categories, search, levelFilter, sortConfig, showHierarchy]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredData.length);

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, filteredData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleSort = (key: keyof Category | "parentName") => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
    setShowHierarchy(false);
  };

  const getSortIcon = (key: keyof Category | "parentName") => {
    if (sortConfig.key !== key) {
      return <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return (
      <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
    );
  };

  // Handlers
  const handleBack = () => {
    window.history.back();
  };

  const handleCreateCategory = () => {
    setAddModal({ isOpen: true });
  };

  const handleEditCategory = (category: Category) => {
    setEditModal({ isOpen: true, category });
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editModal.category) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/categories/${editModal.category._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setCategories(
          categories.map((c) =>
            c._id === editModal.category?._id ? { ...c, ...updatedData } : c,
          ),
        );
        showToast("Category updated successfully!", "success");
        setEditModal({ isOpen: false, category: null });
      } else {
        showToast(data.message || "Failed to update category", "error");
      }
    } catch (err) {
      showToast("Error connecting to server", "error");
    }
  };

  const handleSaveAdd = async (categoryData: any) => {
    try {
      const response = await fetch("https://gamersbd-server.onrender.com/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCategories(); // Refresh the list
        showToast("Category created successfully!", "success");
        setAddModal({ isOpen: false });
      } else {
        showToast(data.message || "Failed to create category", "error");
      }
    } catch (err) {
      showToast("Error connecting to server", "error");
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.categoryId) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/categories/${deleteModal.categoryId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        setCategories(
          categories.filter((c) => c._id !== deleteModal.categoryId),
        );
        showToast("Category deleted successfully!", "success");
      } else {
        const data = await response.json();
        showToast(data.message || "Failed to delete category", "error");
      }
    } catch (err) {
      showToast("Error connecting to server", "error");
    } finally {
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get level badge
  const getLevelBadge = (level: number) => {
    switch (level) {
      case 0:
        return (
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Parent
          </span>
        );
      case 1:
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Child
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            Level {level}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Categories
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Toast Notification - Dark mode support */}
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

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              {/* Back Button - Fixed dark mode */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Title with Icon */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                    📁
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  All Categories
                </h1>
              </div>
            </div>

            {/* Create Button - Keep as is (gradient) */}
            <button
              onClick={handleCreateCategory}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Category</span>
            </button>
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
                <span
                  className="ml-2 text-gray-700 dark:text-gray-300 font-medium"
                  aria-current="page"
                >
                  All Categories
                </span>
              </li>
            </ol>

            {/* Quick Stats - Dark mode support */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                Total: {categories.length}
              </span>
              <span className="flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
                Parent: {categories.filter((c) => c.level === 0).length}
              </span>
              <span className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></span>
                Child: {categories.filter((c) => c.level === 1).length}
              </span>
            </div>
          </nav>
        </div>

        {/* Stats Cards - Update StatCard component */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Categories"
            value={categories.length}
            color="blue"
            icon="📊"
          />
          <StatCard
            title="Parent Categories"
            value={categories.filter((c) => c.level === 0).length}
            color="purple"
            icon="📂"
          />
          <StatCard
            title="Child Categories"
            value={categories.filter((c) => c.level === 1).length}
            color="green"
            icon="📄"
          />
          <StatCard
            title="With Description"
            value={categories.filter((c) => c.description).length}
            color="orange"
            icon="📝"
          />
        </div>

        {/* Main Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, description, or parent..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 w-full sm:w-auto">
                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Levels</option>
                  <option value="0">Parent Categories Only</option>
                  <option value="1">Child Categories Only</option>
                </select>

                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <button
                  onClick={() => {
                    setShowHierarchy(!showHierarchy);
                    setSortConfig({ key: null, direction: null });
                  }}
                  className={`px-3 py-2 rounded-lg border transition ${
                    showHierarchy
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  title="Show hierarchical view"
                >
                  <span className="flex items-center gap-1">
                    <span>📊</span>
                    <span className="hidden sm:inline">Hierarchy</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name {getSortIcon("name")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    onClick={() => handleSort("parentName")}
                  >
                    <div className="flex items-center">
                      Parent Category {getSortIcon("parentName")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    onClick={() => handleSort("level")}
                  >
                    <div className="flex items-center">
                      Level {getSortIcon("level")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Created {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.level === 1 && (
                            <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
                              ↳
                            </span>
                          )}
                          <div
                            className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${item.level === 1 ? "ml-2" : ""}`}
                          >
                            {item.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {item.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.parent ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                              {item.parent.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLevelBadge(item.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCategory(item)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                            title="Edit category"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                            title="Delete category"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition opacity-0 group-hover:opacity-100"
                            title="More options"
                          >
                            <EllipsisVerticalIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FunnelIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          No categories found
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          Try adjusting your search or filter
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{endIndex}</span> of{" "}
                <span className="font-medium">{filteredData.length}</span>{" "}
                results
              </p>

              <div className="flex items-center gap-2">
                <PaginationButton
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  icon={<ChevronDoubleLeftIcon className="w-5 h-5" />}
                />
                <PaginationButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  icon={<ChevronLeftIcon className="w-5 h-5" />}
                />

                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <PaginationButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  icon={<ChevronRightIcon className="w-5 h-5" />}
                />
                <PaginationButton
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  icon={<ChevronDoubleRightIcon className="w-5 h-5" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals (they already have dark mode support from previous code) */}
      <EditCategoryModal
        isOpen={editModal.isOpen}
        category={editModal.category}
        onClose={() => setEditModal({ isOpen: false, category: null })}
        onSave={handleSaveEdit}
        categories={categories}
      />

      <AddCategoryModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ isOpen: false })}
        onSave={handleSaveAdd}
        categories={categories}
      />

      <DeleteCategoryModal
        isOpen={deleteModal.isOpen}
        categoryName={deleteModal.categoryName}
        onClose={() =>
          setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" })
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
};

// Helper Components
const StatCard = ({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}
        >
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const PaginationButton = ({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
}) => (
  <button
    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-600 dark:text-gray-400"
    onClick={onClick}
    disabled={disabled}
  >
    {icon}
  </button>
);

export default AllCategories;
