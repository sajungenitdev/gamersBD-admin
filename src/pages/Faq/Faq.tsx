"use client";
import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  EyeIcon,
} from "../../icons";
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  popular: boolean;
  order: number;
  views: number;
  helpful: {
    yes: number;
    no: number;
  };
  isActive: boolean;
  createdAt: string;
}

const categories = [
  { id: "orders", name: "Orders & Shipping", color: "bg-blue-500/20 text-blue-400" },
  { id: "payment", name: "Payment & Billing", color: "bg-green-500/20 text-green-400" },
  { id: "returns", name: "Returns & Refunds", color: "bg-yellow-500/20 text-yellow-400" },
  { id: "account", name: "Account Management", color: "bg-purple-500/20 text-purple-400" },
  { id: "games", name: "Games & Digital", color: "bg-pink-500/20 text-pink-400" },
  { id: "technical", name: "Technical Support", color: "bg-orange-500/20 text-orange-400" },
];

const Faq = () => {
  const { token } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  // Fetch FAQs
  const fetchFAQs = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("https://gamersbd-server.onrender.com/api/faqs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch FAQs");
      }

      setFaqs(data.data);
    } catch (error) {
      console.error("Fetch FAQs error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to load FAQs",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFAQs();
    }
  }, [token]);

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Create FAQ
  const handleCreateFAQ = async (faqData: any) => {
    try {
      const response = await fetch("https://gamersbd-server.onrender.com/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create FAQ");
      }

      await fetchFAQs();
      setIsCreateModalOpen(false);
      showToast("FAQ created successfully!", "success");
    } catch (error: any) {
      console.error("Failed to create FAQ:", error);
      showToast(error.message || "Failed to create FAQ", "error");
      throw error;
    }
  };

  // Update FAQ
  const handleUpdateFAQ = async (faqData: any) => {
    if (!selectedFaq) return;

    try {
      const response = await fetch(`https://gamersbd-server.onrender.com/api/faqs/${selectedFaq._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update FAQ");
      }

      await fetchFAQs();
      setIsEditModalOpen(false);
      setSelectedFaq(null);
      showToast("FAQ updated successfully!", "success");
    } catch (error: any) {
      console.error("Failed to update FAQ:", error);
      showToast(error.message || "Failed to update FAQ", "error");
      throw error;
    }
  };

  // Delete FAQ
  const handleDeleteFAQ = async () => {
    if (!selectedFaq) return;

    try {
      const response = await fetch(`https://gamersbd-server.onrender.com/api/faqs/${selectedFaq._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete FAQ");
      }

      await fetchFAQs();
      setIsDeleteModalOpen(false);
      setSelectedFaq(null);
      showToast("FAQ deleted successfully!", "success");
    } catch (error: any) {
      console.error("Failed to delete FAQ:", error);
      showToast(error.message || "Failed to delete FAQ", "error");
    }
  };

  // Toggle popular status
  const togglePopular = async (faq: FAQ) => {
    try {
      const response = await fetch(`https://gamersbd-server.onrender.com/api/faqs/${faq._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ popular: !faq.popular }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update FAQ");
      }

      await fetchFAQs();
      showToast(`FAQ ${!faq.popular ? "marked as popular" : "removed from popular"}`, "success");
    } catch (error: any) {
      console.error("Failed to toggle popular:", error);
      showToast(error.message || "Failed to update FAQ", "error");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Question", "Category", "Popular", "Views", "Helpful Yes", "Helpful No", "Created Date"];
    const csvData = filteredFaqs.map((faq) => [
      faq.question,
      faq.category,
      faq.popular ? "Yes" : "No",
      faq.views,
      faq.helpful.yes,
      faq.helpful.no,
      new Date(faq.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faqs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get category badge
  const getCategoryBadge = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category || categories[0];
  };

  if (loading && faqs.length === 0) {
    return (
      <>
        <PageMeta title="FAQs | Admin" description="Manage FAQs" />
        <PageBreadcrumb pageTitle="FAQ Management" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="FAQs | Admin" description="Manage FAQs" />
      <PageBreadcrumb pageTitle="FAQ Management" />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transition-all transform animate-slide-in">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
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
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total FAQs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {faqs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Popular FAQs</p>
            <p className="text-2xl font-bold text-yellow-600">
              {faqs.filter((f) => f.popular).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-blue-600">
              {faqs.reduce((sum, f) => sum + (f.views || 0), 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Helpful Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {faqs.length > 0
                ? Math.round(
                    (faqs.reduce((sum, f) => sum + (f.helpful?.yes || 0), 0) /
                      (faqs.reduce((sum, f) => sum + (f.helpful?.yes || 0), 0) +
                        faqs.reduce((sum, f) => sum + (f.helpful?.no || 0), 0))) *
                      100
                  ) || 0
                : 0}
              %
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(faqs.map((f) => f.category)).size}
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
                placeholder="Search FAQs by question or answer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchFAQs}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Refresh"
              >
                <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export CSV
              </button>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create FAQ
              </Button>
            </div>
          </div>
        </div>

        {/* FAQs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Helpful
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
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => {
                    const category = getCategoryBadge(faq.category);
                    return (
                      <tr
                        key={faq._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {faq.question}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                              {faq.answer.substring(0, 100)}...
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${category.color}`}
                          >
                            {category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePopular(faq)}
                              className={`px-2 py-1 text-xs rounded-full transition ${
                                faq.popular
                                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                              }`}
                            >
                              {faq.popular ? "Popular" : "Not Popular"}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {faq.views || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-500">
                              👍 {faq.helpful?.yes || 0}
                            </span>
                            <span className="text-sm text-red-500">
                              👎 {faq.helpful?.no || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(faq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFaq(faq);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 rounded-full transition"
                              title="View FAQ"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFaq(faq);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition"
                              title="Edit FAQ"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFaq(faq);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition"
                              title="Delete FAQ"
                            >
                              <TrashBinIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {search || selectedCategory !== "all"
                            ? "No FAQs found matching your filters"
                            : "No FAQs yet"}
                        </p>
                        {(search || selectedCategory !== "all") && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setSelectedCategory("all");
                            }}
                            className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Clear filters
                          </button>
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

      {/* Create FAQ Modal */}
      <CreateFAQModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateFAQ}
      />

      {/* Edit FAQ Modal */}
      <EditFAQModal
        isOpen={isEditModalOpen}
        faq={selectedFaq}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFaq(null);
        }}
        onSave={handleUpdateFAQ}
      />

      {/* View FAQ Modal */}
      <ViewFAQModal
        isOpen={isViewModalOpen}
        faq={selectedFaq}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedFaq(null);
        }}
      />

      {/* Delete FAQ Modal */}
      <DeleteFAQModal
        isOpen={isDeleteModalOpen}
        faq={selectedFaq}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedFaq(null);
        }}
        onConfirm={handleDeleteFAQ}
      />
    </>
  );
};

// Create FAQ Modal Component
const CreateFAQModal = ({ isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "orders",
    popular: false,
    order: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      setFormData({
        question: "",
        answer: "",
        category: "orders",
        popular: false,
        order: 0,
      });
    } catch (error) {
      console.error("Error saving FAQ:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New FAQ
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question *
                </label>
                <textarea
                  rows={2}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the question"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Answer *
                </label>
                <textarea
                  rows={6}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the answer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Display order"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) =>
                      setFormData({ ...formData, popular: e.target.checked })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as Popular
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.question || !formData.answer}
                  className="flex-1"
                >
                  {saving ? "Creating..." : "Create FAQ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit FAQ Modal Component
const EditFAQModal = ({ isOpen, faq, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "orders",
    popular: false,
    order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question || "",
        answer: faq.answer || "",
        category: faq.category || "orders",
        popular: faq.popular || false,
        order: faq.order || 0,
      });
    }
  }, [faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error updating FAQ:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit FAQ
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question *
                </label>
                <textarea
                  rows={2}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the question"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Answer *
                </label>
                <textarea
                  rows={6}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter the answer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Display order"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) =>
                      setFormData({ ...formData, popular: e.target.checked })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as Popular
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.question || !formData.answer}
                  className="flex-1"
                >
                  {saving ? "Updating..." : "Update FAQ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// View FAQ Modal Component
const ViewFAQModal = ({ isOpen, faq, onClose }: any) => {
  if (!isOpen || !faq) return null;

  const category = categories.find(c => c.id === faq.category) || categories[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                FAQ Details
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Question
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {faq.question}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Answer
                </label>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${category.color}`}>
                    {category.name}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${faq.popular ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {faq.popular ? "Popular" : "Not Popular"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Views
                  </label>
                  <p className="text-gray-900 dark:text-white">{faq.views || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Order
                  </label>
                  <p className="text-gray-900 dark:text-white">{faq.order || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Helpful Votes
                  </label>
                  <div className="flex gap-3">
                    <span className="text-green-500">👍 {faq.helpful?.yes || 0}</span>
                    <span className="text-red-500">👎 {faq.helpful?.no || 0}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created Date
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(faq.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete FAQ Modal Component
const DeleteFAQModal = ({ isOpen, faq, onClose, onConfirm }: any) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !faq) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <TrashBinIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete FAQ
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Are you sure you want to delete this FAQ?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                <strong>Question:</strong> {faq.question.substring(0, 100)}...
              </p>
              <p className="text-xs text-red-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;