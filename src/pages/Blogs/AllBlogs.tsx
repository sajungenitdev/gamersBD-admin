"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import CreateBlogModal from "./CreateBlogModal";
import EditBlogModal from "./EditBlogModal";
import DeleteBlogModal from "./DeleteBlogModal";
import { Blog, blogService } from "../../services/blog.service";
import {
  DocumentPlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const AllBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [refetchKey, setRefetchKey] = useState(0); // Add refetch key

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Fetch blogs - wrapped in useCallback
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching blogs...");
      const data = await blogService.getAllBlogs();
      console.log("Fetched blogs:", data);
      setBlogs(data);
    } catch (error) {
      console.error("Fetch blogs error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to load blogs",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch blogs when component mounts or refetchKey changes
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs, refetchKey]);

  // Filter blogs based on search
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title?.toLowerCase().includes(search.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      blog.category?.toLowerCase().includes(search.toLowerCase()) ||
      blog.tags?.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase()),
      );

    return matchesSearch;
  });

  // Handle create blog
  const handleCreateBlog = async (blogData: any) => {
    console.log("handleCreateBlog called with:", blogData);

    try {
      const result = await blogService.createBlog(blogData);
      console.log("Create blog result:", result);

      // Refresh the blogs list
      await fetchBlogs();

      showToast("Blog created successfully!", "success");
      return result;
    } catch (error: any) {
      console.error("Failed to create blog:", error);
      showToast(error.message || "Failed to create blog", "error");
      throw error;
    }
  };

  // Handle edit blog
  const handleEditBlog = async (blogData: any) => {
    if (!selectedBlog) return;

    try {
      console.log("Updating blog...");
      const updatedBlog = await blogService.updateBlog(
        selectedBlog._id,
        blogData,
      );
      console.log("Blog updated:", updatedBlog);

      // Force refetch
      setRefetchKey((prev) => prev + 1);

      showToast("Blog updated successfully!", "success");
      setIsEditModalOpen(false);
      setSelectedBlog(null);
    } catch (error: any) {
      console.error("Failed to update blog:", error);
      showToast(error.message || "Failed to update blog", "error");
      throw error;
    }
  };

  // Handle delete blog
  const handleDeleteBlog = async () => {
    if (!selectedBlog) return;

    try {
      console.log("Deleting blog...");
      await blogService.deleteBlog(selectedBlog._id);
      console.log("Blog deleted");

      // Force refetch
      setRefetchKey((prev) => prev + 1);

      showToast("Blog deleted successfully!", "success");
      setIsDeleteModalOpen(false);
      setSelectedBlog(null);
    } catch (error: any) {
      console.error("Failed to delete blog:", error);
      showToast(error.message || "Failed to delete blog", "error");
      throw error;
    }
  };

  const openEditModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (blog: Blog) => {
    setSelectedBlog(blog);
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

  if (loading && blogs.length === 0) {
    return (
      <>
        <PageMeta title="Blogs | Admin" description="Manage blogs" />
        <PageBreadcrumb pageTitle="Blog Management" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Blogs | Admin" description="Manage blogs" />
      <PageBreadcrumb pageTitle="Blog Management" />

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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Blogs
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {blogs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Published
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {blogs.filter((b) => b.isPublished).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {blogs.filter((b) => b.featured).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Views
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {blogs.reduce((sum, b) => sum + (b.views || 0), 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Likes
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {blogs.reduce((sum, b) => sum + (b.likes || 0), 0)}
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
                placeholder="Search blogs by title, category, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Create Blog Button */}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <DocumentPlusIcon className="w-5 h-5" />
              <span>Create New Blog</span>
            </Button>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Blog
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views/Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBlogs.length > 0 ? (
                  filteredBlogs.map((blog) => (
                    <tr
                      key={blog._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <img
                              src={blog.image}
                              alt={blog.title}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {blog.title?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {blog.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {blog.excerpt}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
                          {blog.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-xs px-2 py-1 rounded-full ${
                              blog.isPublished
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {blog.isPublished ? "Published" : "Draft"}
                          </span>
                          {blog.featured && (
                            <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ml-2">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>👁️ {blog.views || 0}</div>
                          <div>❤️ {blog.likes || 0}</div>
                          <div>💬 {blog.commentCount || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {blog.author?.avatar && (
                            <img
                              src={blog.author.avatar}
                              alt={blog.author.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {blog.author?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {blog.author?.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(blog.publishedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/news/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 rounded-full transition"
                            title="View blog"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => openEditModal(blog)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition"
                            title="Edit blog"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(blog)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition"
                            title="Delete blog"
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
                            ? "No blogs found matching your search"
                            : "No blogs yet"}
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

      {/* Create Blog Modal */}
      <CreateBlogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateBlog}
      />

      {/* Edit Blog Modal */}
      <EditBlogModal
        isOpen={isEditModalOpen}
        blog={selectedBlog}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBlog(null);
        }}
        onSave={handleEditBlog}
      />

      {/* Delete Blog Modal */}
      <DeleteBlogModal
        isOpen={isDeleteModalOpen}
        blog={selectedBlog}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBlog(null);
        }}
        onConfirm={handleDeleteBlog}
      />
    </>
  );
};

export default AllBlogs;
