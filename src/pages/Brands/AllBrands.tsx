import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  brandService,
  Brand,
  CreateBrandDto,
  UpdateBrandDto,
} from "../../services/brand.service";
import { PencilIcon, TrashBinIcon } from "../../icons";
import {
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import AddBrandModal from "./AddBrandModal";
import EditBrandModal from "./EditBrandModal";
import DeleteBrandModal from "./DeleteBrandModal";

const AllBrands = () => {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  // Fetch brands
  const fetchBrands = async () => {
    if (!token) {
      console.log("No token, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching brands...");
      const data = await brandService.getAllBrands(token);
      console.log("Brands fetched:", data);
      setBrands(data);
    } catch (error) {
      console.error("Fetch brands error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to load brands",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBrands();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Handle add brand
  const handleAddBrand = async (brandData: CreateBrandDto) => {
    console.log("Creating brand with data:", brandData);

    try {
      if (!token) {
        showToast("Please log in to create a brand", "error");
        return;
      }

      // Create the brand
      const newBrand = await brandService.createBrand(token, brandData);
      console.log("Brand created successfully:", newBrand);

      // Close modal FIRST
      setIsAddModalOpen(false);

      // Show success toast
      showToast("Brand created successfully!", "success");

      // Refresh the brands list
      await fetchBrands();
    } catch (error: any) {
      console.error("Failed to add brand:", error);
      const errorMessage = error.message || "Failed to create brand";
      showToast(errorMessage, "error");
      throw error; // Re-throw to let modal know it failed
    }
  };

  // Handle edit brand
  const handleEditBrand = async (brandData: UpdateBrandDto) => {
    if (!selectedBrand) return;

    try {
      const updatedBrand = await brandService.updateBrand(
        selectedBrand._id,
        brandData,
      );
      setBrands(
        brands.map((b) => (b._id === updatedBrand._id ? updatedBrand : b)),
      );
      showToast("Brand updated successfully!", "success");
      setIsEditModalOpen(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error("Edit brand error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update brand",
        "error",
      );
      throw error;
    }
  };

  // Handle delete brand
  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;

    try {
      await brandService.deleteBrand(selectedBrand._id);
      setBrands(brands.filter((b) => b._id !== selectedBrand._id));
      showToast("Brand deleted successfully!", "success");
      setIsDeleteModalOpen(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error("Delete brand error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to delete brand",
        "error",
      );
      throw error;
    }
  };

  // Handle toggle popular
  const handleTogglePopular = async (brand: Brand) => {
    try {
      const updatedBrand = await brandService.togglePopularStatus(brand._id);
      setBrands(
        brands.map((b) => (b._id === updatedBrand._id ? updatedBrand : b)),
      );
      showToast(
        `Brand ${updatedBrand.isPopular ? "marked as popular" : "removed from popular"}`,
        "success",
      );
    } catch (error) {
      console.error("Toggle popular error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update brand",
        "error",
      );
    }
  };

  // Handle toggle active
  const handleToggleActive = async (brand: Brand) => {
    try {
      const updatedBrand = await brandService.toggleStatus(brand._id);
      setBrands(
        brands.map((b) => (b._id === updatedBrand._id ? updatedBrand : b)),
      );
      showToast(
        `Brand ${updatedBrand.isActive ? "activated" : "deactivated"}`,
        "success",
      );
    } catch (error) {
      console.error("Toggle active error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update brand",
        "error",
      );
    }
  };

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteModalOpen(true);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && brands.length === 0) {
    return (
      <>
        <PageMeta title="Brands | Admin" description="Manage brands" />
        <PageBreadcrumb pageTitle="Brand Management" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Brands | Admin" description="Manage brands" />
      <PageBreadcrumb pageTitle="Brand Management" />

      {/* Toast Notification - Make sure this is visible */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transition-all transform animate-slide-in">
          <div
            className={`flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            } p-3 rounded-lg`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToast({ show: false, message: "", type: "success" })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Brands
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {brands.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active Brands
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {brands.filter((b) => b.isActive).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Popular Brands
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {brands.filter((b) => b.isPopular).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Products
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {brands.reduce((sum, b) => sum + (b.productCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Add Brand Button */}
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <DocumentPlusIcon className="w-5 h-5" />
              <span>Add Brand</span>
            </Button>
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Founded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <tr
                      key={brand._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-10 h-10 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {brand.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {brand.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {brand.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-xs">
                          {brand.description || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <button
                            onClick={() => handleToggleActive(brand)}
                            className={`block text-xs px-2 py-1 rounded-full transition-colors ${
                              brand.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            {brand.isActive ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => handleTogglePopular(brand)}
                            className={`block text-xs px-2 py-1 rounded-full transition-colors ${
                              brand.isPopular
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            {brand.isPopular ? "Popular" : "Not Popular"}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {brand.productCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {brand.foundedYear || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(brand.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(brand)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition"
                            title="Edit brand"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(brand)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition"
                            title="Delete brand"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {search
                            ? "No brands found matching your search"
                            : "No brands yet"}
                        </p>
                        {search && (
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                            Try adjusting your search
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddBrandModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddBrand}
      />

      <EditBrandModal
        isOpen={isEditModalOpen}
        brand={selectedBrand}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBrand(null);
        }}
        onSave={handleEditBrand}
      />

      <DeleteBrandModal
        isOpen={isDeleteModalOpen}
        brand={selectedBrand}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBrand(null);
        }}
        onConfirm={handleDeleteBrand}
      />
    </>
  );
};

export default AllBrands;
