// components/Brands/EditBrandModal.tsx
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { Brand, UpdateBrandDto, brandService } from "../../services/brand.service";
import { useAuth } from "../../context/AuthContext";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

interface EditBrandModalProps {
  isOpen: boolean;
  brand: Brand | null;
  onClose: () => void;
  onSave: (brandData: UpdateBrandDto) => Promise<void>;
}

export default function EditBrandModal({ isOpen, brand, onClose, onSave }: EditBrandModalProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<UpdateBrandDto>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'social' | 'seo'>('basic');

  // Populate form when brand data changes
  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
        website: brand.website || '',
        foundedYear: brand.foundedYear,
        isPopular: brand.isPopular,
        isActive: brand.isActive,
        headquarters: brand.headquarters || { country: '', city: '', address: '' },
        contact: brand.contact || { email: '', phone: '', supportEmail: '' },
        social: brand.social || { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '' },
        seo: brand.seo || { metaTitle: '', metaDescription: '', metaKeywords: [] },
      });
      setLogoPreview(brand.logo || null);
      setCoverPreview(brand.coverImage || null);
    }
  }, [brand]);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (type === 'logo') {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    } else {
      setCoverFile(file);
      const preview = URL.createObjectURL(file);
      setCoverPreview(preview);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'cover') => {
    if (type === 'logo') {
      setLogoFile(null);
      setLogoPreview(null);
      setFormData({ ...formData, logo: null });
    } else {
      setCoverFile(null);
      setCoverPreview(null);
      setFormData({ ...formData, coverImage: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !brand) return;
    
    setSaving(true);
    
    try {
      const updatedData = { ...formData };
      
      // Convert new images to base64 if selected
      if (logoFile) {
        updatedData.logo = await brandService.imageToBase64(logoFile);
      }
      if (coverFile) {
        updatedData.coverImage = await brandService.imageToBase64(coverFile);
      }

      await onSave(updatedData);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !brand) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Brand: {brand.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
              {(['basic', 'contact', 'social', 'seo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Logo Upload */}
                    <div>
                      <Label>Brand Logo</Label>
                      <div className="mt-1 flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-20 h-20 object-contain border rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('logo')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              title="Remove logo"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-400">No logo</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'logo')}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <Label>Cover Image</Label>
                      <div className="mt-1 flex items-center gap-4">
                        {coverPreview ? (
                          <div className="relative">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="w-20 h-20 object-cover border rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('cover')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              title="Remove cover"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-400">No cover</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'cover')}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Brand Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter brand name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter brand description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Website</Label>
                      <Input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <Label>Founded Year</Label>
                      <Input
                        type="number"
                        value={formData.foundedYear || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          foundedYear: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="1949"
                        min="1800"
                        max={String(new Date().getFullYear())}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Country</Label>
                      <Input
                        type="text"
                        value={formData.headquarters?.country || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          headquarters: { ...formData.headquarters, country: e.target.value }
                        })}
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        type="text"
                        value={formData.headquarters?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          headquarters: { ...formData.headquarters, city: e.target.value }
                        })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        type="text"
                        value={formData.headquarters?.address || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          headquarters: { ...formData.headquarters, address: e.target.value }
                        })}
                        placeholder="Address"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPopular || false}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Popular</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact?.email || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, email: e.target.value }
                      })}
                      placeholder="info@brand.com"
                    />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={formData.contact?.supportEmail || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, supportEmail: e.target.value }
                      })}
                      placeholder="support@brand.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={formData.contact?.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, phone: e.target.value }
                      })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
              )}

              {/* Social Tab */}
              {activeTab === 'social' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  {(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] as const).map((platform) => (
                    <div key={platform}>
                      <Label className="capitalize">{platform}</Label>
                      <Input
                        type="url"
                        value={formData.social?.[platform] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          social: { ...formData.social, [platform]: e.target.value }
                        })}
                        placeholder={`https://${platform}.com/...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      type="text"
                      value={formData.seo?.metaTitle || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaTitle: e.target.value }
                      })}
                      placeholder="SEO Title"
                    />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <textarea
                      value={formData.seo?.metaDescription || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaDescription: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="SEO Description"
                    />
                  </div>
                  <div>
                    <Label>Meta Keywords (comma separated)</Label>
                    <Input
                      type="text"
                      value={formData.seo?.metaKeywords?.join(', ') || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: {
                          ...formData.seo,
                          metaKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                        }
                      })}
                      placeholder="sports, shoes, fashion"
                    />
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}