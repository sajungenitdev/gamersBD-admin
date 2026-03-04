// services/brand.service.ts

const API_URL = "https://gamersbd-server.onrender.com/api";

export interface Headquarters {
  country?: string;
  city?: string;
  address?: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  supportEmail?: string;
}

export interface Social {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  coverImage?: string | null;
  website?: string;
  foundedYear?: number;
  headquarters?: Headquarters;
  contact?: Contact;
  social?: Social;
  seo?: SEO;
  isActive: boolean;
  isPopular: boolean;
  productCount: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBrandDto {
  name: string;
  slug?: string; // ADD THIS - optional because it will be auto-generated
  description?: string;
  logo?: string | null;
  coverImage?: string | null;
  website?: string;
  foundedYear?: number;
  headquarters?: Headquarters;
  contact?: Contact;
  social?: Social;
  seo?: SEO;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface UpdateBrandDto {
  name?: string;
  slug?: string; // ADD THIS - optional
  description?: string;
  logo?: string | null;
  coverImage?: string | null;
  website?: string;
  foundedYear?: number;
  headquarters?: Headquarters;
  contact?: Contact;
  social?: Social;
  seo?: SEO;
  isPopular?: boolean;
  isActive?: boolean;
}

export const brandService = {
  // Get all brands
  async getAllBrands(
    token: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      isActive?: boolean;
      isPopular?: boolean;
      search?: string;
    },
  ): Promise<Brand[]> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_URL}/brands?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch brands");
    }

    return data.data;
  },

  // Get popular brands
  async getPopularBrands(token: string, limit: number = 8): Promise<Brand[]> {
    const response = await fetch(`${API_URL}/brands/popular?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch popular brands");
    }

    return data.data;
  },

  // Get single brand by ID or slug
  async getBrandByIdentifier(
    token: string,
    identifier: string,
  ): Promise<Brand> {
    const response = await fetch(`${API_URL}/brands/${identifier}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch brand");
    }

    return data.data;
  },

  // Create brand
  async createBrand(token: string, brandData: CreateBrandDto): Promise<Brand> {
    // Generate slug from name if not provided
    const dataToSend = { ...brandData };
    
    if (dataToSend.name && !dataToSend.slug) {
      dataToSend.slug = dataToSend.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const response = await fetch(`${API_URL}/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create brand");
    }

    return data.data;
  },

  // Update brand
  async updateBrand(
    token: string,
    id: string,
    brandData: UpdateBrandDto,
  ): Promise<Brand> {
    // Update slug if name is changed
    const dataToSend = { ...brandData };
    
    if (dataToSend.name) {
      dataToSend.slug = dataToSend.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const response = await fetch(`${API_URL}/brands/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update brand");
    }

    return data.data;
  },

  // Delete brand
  async deleteBrand(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_URL}/brands/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete brand");
    }
  },

  // Toggle brand status (active/inactive)
  async toggleStatus(token: string, id: string): Promise<Brand> {
    const response = await fetch(`${API_URL}/brands/${id}/toggle-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to toggle brand status");
    }

    return data.data;
  },

  // Toggle popular status
  async togglePopularStatus(token: string, id: string): Promise<Brand> {
    const response = await fetch(`${API_URL}/brands/${id}/toggle-popular`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to toggle popular status");
    }

    return data.data;
  },

  // Bulk update brands
  async bulkUpdateBrands(
    token: string,
    brandIds: string[],
    updates: UpdateBrandDto,
  ): Promise<any> {
    const response = await fetch(`${API_URL}/brands/bulk`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ brandIds, updates }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to bulk update brands");
    }

    return data.data;
  },

  // Update product counts for all brands
  async updateProductCounts(token: string): Promise<void> {
    const response = await fetch(`${API_URL}/brands/update-counts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update product counts");
    }
  },

  // Convert image to base64
  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },
};