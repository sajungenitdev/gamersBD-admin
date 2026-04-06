"use client";

import React, { useState, useRef } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blogData: any) => Promise<void>;
}

const categories = [
  "Gaming News",
  "Reviews",
  "Guides",
  "Features",
  "Esports",
  "Wellness",
  "Interviews",
];

export default function CreateBlogModal({
  isOpen,
  onClose,
  onSave,
}: CreateBlogModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    imageFile: null as File | null,
    imagePreview: "",
    category: "Gaming News",
    tags: [] as string[],
    featured: false,
    isPublished: true,
    author: {
      name: "",
      avatar: "",
      avatarFile: null as File | null,
      avatarPreview: "",
      role: "",
      email: "",
    },
  });

  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await convertToBase64(file);
      setFormData({
        ...formData,
        image: base64,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
      setError(null);
    } catch (err) {
      console.error("Error converting image:", err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file for avatar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar size should be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await convertToBase64(file);
      setFormData({
        ...formData,
        author: {
          ...formData.author,
          avatar: base64,
          avatarFile: file,
          avatarPreview: URL.createObjectURL(file),
        },
      });
      setError(null);
    } catch (err) {
      console.error("Error converting avatar:", err);
      setError("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      image: "",
      imageFile: null,
      imagePreview: "",
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeAvatar = () => {
    setFormData({
      ...formData,
      author: {
        ...formData.author,
        avatar: "",
        avatarFile: null,
        avatarPreview: "",
      },
    });
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }
    if (!formData.excerpt.trim()) {
      setError("Excerpt is required");
      setSaving(false);
      return;
    }
    if (!formData.content.trim()) {
      setError("Content is required");
      setSaving(false);
      return;
    }
    if (!formData.author.name.trim()) {
      setError("Author name is required");
      setSaving(false);
      return;
    }

    const blogData = {
      title: formData.title.trim(),
      excerpt: formData.excerpt.trim(),
      content: formData.content,
      image: formData.image || "",
      category: formData.category,
      tags: formData.tags,
      featured: formData.featured,
      isPublished: formData.isPublished,
      author: {
        name: formData.author.name.trim(),
        avatar: formData.author.avatar || "",
        role: formData.author.role || "Contributor",
        email: formData.author.email || "",
      },
    };

    try {
      await onSave(blogData);
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        image: "",
        imageFile: null,
        imagePreview: "",
        category: "Gaming News",
        tags: [],
        featured: false,
        isPublished: true,
        author: {
          name: "",
          avatar: "",
          avatarFile: null,
          avatarPreview: "",
          role: "",
          email: "",
        },
      });
      setTagInput("");
      onClose();
    } catch (err: any) {
      console.error("Error creating blog:", err);
      setError(err.message || "Failed to create blog");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Blog Post
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e: any) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter blog title"
                  required
                />
              </div>

              <div>
                <Label>
                  Excerpt <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Brief description of the blog post"
                  required
                />
              </div>

              <div>
                <Label>
                  Content <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="Full blog content (HTML supported)"
                  required
                />
              </div>

              {/* Featured Image Upload */}
              <div>
                <Label>Featured Image</Label>
                <div className="mt-1 flex items-center gap-4">
                  {formData.imagePreview ? (
                    <div className="relative">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">
                        Upload Image
                      </span>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadingImage && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                  <p className="text-xs text-gray-500">
                    Max size: 5MB. Supported: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={tagInput}
                        onChange={(e: any) => setTagInput(e.target.value)}
                        placeholder="Add tag"
                      />
                    </div>
                    <Button type="button" onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Author Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={formData.author.name}
                      onChange={(e: any) =>
                        setFormData({
                          ...formData,
                          author: { ...formData.author, name: e.target.value },
                        })
                      }
                      placeholder="Author name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.author.email}
                      onChange={(e: any) =>
                        setFormData({
                          ...formData,
                          author: { ...formData.author, email: e.target.value },
                        })
                      }
                      placeholder="author@example.com"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      type="text"
                      value={formData.author.role}
                      onChange={(e: any) =>
                        setFormData({
                          ...formData,
                          author: { ...formData.author, role: e.target.value },
                        })
                      }
                      placeholder="e.g., Senior Editor"
                    />
                  </div>
                  <div>
                    <Label>Author Avatar</Label>
                    <div className="flex items-center gap-3 mt-1">
                      {formData.author.avatarPreview ? (
                        <div className="relative">
                          <img
                            src={formData.author.avatarPreview}
                            alt="Author avatar"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                        >
                          <PhotoIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {formData.author.avatar ? "Change" : "Upload"} Avatar
                      </button>
                      {uploadingAvatar && (
                        <span className="text-xs text-blue-600">
                          Uploading...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 2MB. Square image recommended
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as Featured
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Publish Immediately
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !formData.title ||
                    !formData.excerpt ||
                    !formData.content ||
                    !formData.author.name
                  }
                  className="flex-1"
                >
                  {saving ? "Creating..." : "Create Blog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
