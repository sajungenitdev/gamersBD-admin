"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaSave,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaDiscord,
  FaTwitch,
  FaSearch,
  FaUpload,
  FaTimes,
  FaSyncAlt,
  FaExclamationTriangle,
  FaSpinner,
  FaDollarSign,
  FaCode,
  FaCog,
  FaImage,
} from "react-icons/fa";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { siteSettingService, SiteSettings } from "../../services/siteSetting.service";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const SiteSettingsPage = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<SiteSettings>>({
    siteName: "",
    siteTagline: "",
    siteDescription: "",
    siteLogo: "",
    siteFavicon: "",
    siteBanner: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      linkedin: "",
      discord: "",
      twitch: "",
    },
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    metaAuthor: "",
    footerCopyright: "",
    footerAboutText: "",
    currency: "",
    currencySymbol: "",
    shippingInfo: "",
    maintenanceMode: false,
    maintenanceMessage: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
    customHeaderScript: "",
    customFooterScript: "",
  });

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
  const handleImageUpload = async (
    file: File,
    type: "logo" | "favicon" | "banner"
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const maxSize = type === "favicon" ? 1 : 5;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Image size should be less than ${maxSize}MB`);
      return;
    }

    const setUploading = {
      logo: setUploadingLogo,
      favicon: setUploadingFavicon,
      banner: setUploadingBanner,
    }[type];

    setUploading(true);
    try {
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({
        ...prev,
        [type === "logo" ? "siteLogo" : type === "favicon" ? "siteFavicon" : "siteBanner"]: base64,
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await siteSettingService.getSettings();
      setSettings(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof SiteSettings] as any),
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Handle meta keywords
  const handleMetaKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = e.target.value.split(",").map((k) => k.trim());
    setFormData((prev) => ({ ...prev, metaKeywords: keywords }));
  };

  // Save settings
  const handleSave = async () => {
    if (!token) {
      toast.error("Please login to save settings");
      return;
    }

    setSaving(true);
    try {
      const updatedSettings = await siteSettingService.updateSettings(formData, token);
      setSettings(updatedSettings);
      setFormData(updatedSettings);
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!token) return;
    if (!confirm("Are you sure you want to reset all settings to default?")) return;

    try {
      const defaultSettings = await siteSettingService.resetSettings(token);
      setSettings(defaultSettings);
      setFormData(defaultSettings);
      toast.success("Settings reset to default");
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Failed to reset settings");
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Site Settings | Admin" description="Manage site settings" />
        <PageBreadcrumb pageTitle="Site Settings" />
        <div className="flex items-center justify-center min-h-[400px]">
          <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </>
    );
  }

  const tabs = [
    { id: "general", name: "General", icon: FaGlobe },
    { id: "contact", name: "Contact", icon: FaEnvelope },
    { id: "social", name: "Social Links", icon: FaFacebook },
    { id: "seo", name: "SEO & Meta", icon: FaSearch },
    { id: "footer", name: "Footer", icon: FaCog },
    { id: "payment", name: "Payment & Shipping", icon: FaDollarSign },
    { id: "scripts", name: "Scripts & Analytics", icon: FaCode },
    { id: "maintenance", name: "Maintenance", icon: FaExclamationTriangle },
  ];

  return (
    <>
      <PageMeta title="Site Settings | Admin" description="Manage site settings" />
      <PageBreadcrumb pageTitle="Site Settings" />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Site Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your website settings, branding, and preferences
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <FaSyncAlt className="w-4 h-4" />
                Reset to Default
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  General Settings
                </h3>
                
                {/* Logo Upload */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Site Logo</Label>
                    <div className="mt-2">
                      {formData.siteLogo ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.siteLogo}
                            alt="Site Logo"
                            className="h-20 w-auto object-contain bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, siteLogo: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition"
                        >
                          <FaUpload className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload Logo</span>
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "logo");
                        }}
                        className="hidden"
                      />
                      {uploadingLogo && <FaSpinner className="w-4 h-4 animate-spin mt-2" />}
                    </div>
                  </div>

                  <div>
                    <Label>Favicon</Label>
                    <div className="mt-2">
                      {formData.siteFavicon ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.siteFavicon}
                            alt="Favicon"
                            className="w-10 h-10 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, siteFavicon: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => faviconInputRef.current?.click()}
                          className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition"
                        >
                          <FaUpload className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload</span>
                        </div>
                      )}
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "favicon");
                        }}
                        className="hidden"
                      />
                      {uploadingFavicon && <FaSpinner className="w-4 h-4 animate-spin mt-2" />}
                    </div>
                  </div>

                  <div>
                    <Label>Site Banner</Label>
                    <div className="mt-2">
                      {formData.siteBanner ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.siteBanner}
                            alt="Site Banner"
                            className="h-20 w-40 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, siteBanner: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => bannerInputRef.current?.click()}
                          className="w-40 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition"
                        >
                          <FaUpload className="w-5 h-5 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload Banner</span>
                        </div>
                      )}
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "banner");
                        }}
                        className="hidden"
                      />
                      {uploadingBanner && <FaSpinner className="w-4 h-4 animate-spin mt-2" />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Site Name</Label>
                    <Input
                      name="siteName"
                      value={formData.siteName}
                      onChange={handleInputChange}
                      placeholder="Enter site name"
                    />
                  </div>
                  <div>
                    <Label>Site Tagline</Label>
                    <Input
                      name="siteTagline"
                      value={formData.siteTagline}
                      onChange={handleInputChange}
                      placeholder="Enter site tagline"
                    />
                  </div>
                </div>

                <div>
                  <Label>Site Description</Label>
                  <textarea
                    name="siteDescription"
                    value={formData.siteDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter site description"
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="+8801234567890"
                    />
                  </div>
                </div>
                <div>
                  <Label>Contact Address</Label>
                  <textarea
                    name="contactAddress"
                    value={formData.contactAddress}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === "social" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Social Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FaFacebook className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <Label>Facebook</Label>
                      <Input
                        name="socialLinks.facebook"
                        value={formData.socialLinks?.facebook}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaTwitter className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <Label>Twitter</Label>
                      <Input
                        name="socialLinks.twitter"
                        value={formData.socialLinks?.twitter}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaInstagram className="w-5 h-5 text-pink-600" />
                    <div className="flex-1">
                      <Label>Instagram</Label>
                      <Input
                        name="socialLinks.instagram"
                        value={formData.socialLinks?.instagram}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaYoutube className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <Label>YouTube</Label>
                      <Input
                        name="socialLinks.youtube"
                        value={formData.socialLinks?.youtube}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaLinkedin className="w-5 h-5 text-blue-700" />
                    <div className="flex-1">
                      <Label>LinkedIn</Label>
                      <Input
                        name="socialLinks.linkedin"
                        value={formData.socialLinks?.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaDiscord className="w-5 h-5 text-indigo-500" />
                    <div className="flex-1">
                      <Label>Discord</Label>
                      <Input
                        name="socialLinks.discord"
                        value={formData.socialLinks?.discord}
                        onChange={handleInputChange}
                        placeholder="https://discord.gg/invite"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaTwitch className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <Label>Twitch</Label>
                      <Input
                        name="socialLinks.twitch"
                        value={formData.socialLinks?.twitch}
                        onChange={handleInputChange}
                        placeholder="https://twitch.tv/yourchannel"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  SEO & Meta Settings
                </h3>
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Enter meta title"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended length: 50-60 characters
                  </p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter meta description"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended length: 150-160 characters
                  </p>
                </div>
                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={formData.metaKeywords?.join(", ")}
                    onChange={handleMetaKeywordsChange}
                    placeholder="gaming, games, store, bangladesh"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate keywords with commas
                  </p>
                </div>
                <div>
                  <Label>Meta Author</Label>
                  <Input
                    name="metaAuthor"
                    value={formData.metaAuthor}
                    onChange={handleInputChange}
                    placeholder="Enter author name"
                  />
                </div>
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === "footer" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Footer Settings
                </h3>
                <div>
                  <Label>Copyright Text</Label>
                  <Input
                    name="footerCopyright"
                    value={formData.footerCopyright}
                    onChange={handleInputChange}
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>
                <div>
                  <Label>About Text</Label>
                  <textarea
                    name="footerAboutText"
                    value={formData.footerAboutText}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter about text for footer"
                  />
                </div>
              </div>
            )}

            {/* Payment & Shipping Tab */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment & Shipping Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Currency</Label>
                    <Input
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      placeholder="BDT"
                    />
                  </div>
                  <div>
                    <Label>Currency Symbol</Label>
                    <Input
                      name="currencySymbol"
                      value={formData.currencySymbol}
                      onChange={handleInputChange}
                      placeholder="৳"
                    />
                  </div>
                </div>
                <div>
                  <Label>Shipping Information</Label>
                  <textarea
                    name="shippingInfo"
                    value={formData.shippingInfo}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter shipping information"
                  />
                </div>
              </div>
            )}

            {/* Scripts Tab */}
            {activeTab === "scripts" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analytics & Scripts
                </h3>
                <div>
                  <Label>Google Analytics ID</Label>
                  <Input
                    name="googleAnalyticsId"
                    value={formData.googleAnalyticsId}
                    onChange={handleInputChange}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label>Facebook Pixel ID</Label>
                  <Input
                    name="facebookPixelId"
                    value={formData.facebookPixelId}
                    onChange={handleInputChange}
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <Label>Custom Header Script</Label>
                  <textarea
                    name="customHeaderScript"
                    value={formData.customHeaderScript}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="<!-- Custom header scripts -->"
                  />
                </div>
                <div>
                  <Label>Custom Footer Script</Label>
                  <textarea
                    name="customFooterScript"
                    value={formData.customFooterScript}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="<!-- Custom footer scripts -->"
                  />
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Maintenance Mode
                </h3>
                <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <div>
                    <Label className="font-semibold">Enable Maintenance Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, only admins can access the site. Regular visitors will see the maintenance message.
                    </p>
                  </div>
                </div>

                {formData.maintenanceMode && (
                  <div>
                    <Label>Maintenance Message</Label>
                    <textarea
                      name="maintenanceMessage"
                      value={formData.maintenanceMessage}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="We'll be back soon! Site is under maintenance."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteSettingsPage;