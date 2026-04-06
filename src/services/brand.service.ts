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
  slug?: string;
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
  slug?: string;
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

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Log the error for debugging
    console.error(`API Error (${response.status}):`, data);
    
    // Throw a more descriptive error
    throw new Error(
      data.message || 
      data.error || 
      `Request failed with status ${response.status}`
    );
  }
  
  return data;
};

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
    if (!token) {
      throw new Error("Authentication token is required");
    }

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

    const data = await handleResponse(response);
    return data.data;
  },

  // Get popular brands
  async getPopularBrands(token: string, limit: number = 8): Promise<Brand[]> {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await fetch(`${API_URL}/brands/popular?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await handleResponse(response);
    return data.data;
  },

  // Get single brand by ID or slug
  async getBrandByIdentifier(
    token: string,
    identifier: string,
  ): Promise<Brand> {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await fetch(`${API_URL}/brands/${identifier}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await handleResponse(response);
    return data.data;
  },

  // Create brand
  async createBrand(token: string, brandData: CreateBrandDto): Promise<Brand> {
    // Validate token
    if (!token) {
      throw new Error("Authentication token is required. Please log in.");
    }

    // Validate required fields
    if (!brandData.name) {
      throw new Error("Brand name is required");
    }

    // Generate slug from name if not provided
    const dataToSend = { ...brandData };
    
    if (dataToSend.name && !dataToSend.slug) {
      dataToSend.slug = generateSlug(dataToSend.name);
    }

    // Log the request for debugging (remove in production)
    console.log("Creating brand with data:", {
      ...dataToSend,
      logo: dataToSend.logo ? "[BASE64_IMAGE]" : undefined,
      coverImage: dataToSend.coverImage ? "[BASE64_IMAGE]" : undefined,
    });
    console.log("Using token:", token.substring(0, 20) + "...");

    const response = await fetch(`${API_URL}/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    });

    const data = await handleResponse(response);
    return data.data;
  },

  // Update brand
async updateBrand(id: string, brandData: UpdateBrandDto): Promise<Brand> {
  if (!id) {
    throw new Error("Brand ID is required");
  }

  // Update slug if name is changed
  const dataToSend = { ...brandData };
  
  if (dataToSend.name) {
    dataToSend.slug = generateSlug(dataToSend.name);
  }

  const response = await fetch(`${API_URL}/brands/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      // No Authorization header needed
    },
    body: JSON.stringify(dataToSend),
  });

  const data = await handleResponse(response);
  return data.data;
},

  // Delete brand
async deleteBrand(id: string): Promise<void> {
  if (!id) {
    throw new Error("Brand ID is required");
  }

  const response = await fetch(`${API_URL}/brands/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      // No Authorization header needed
    },
  });

  await handleResponse(response);
},

  // Toggle brand status (active/inactive)
async toggleStatus(id: string): Promise<Brand> {
  const response = await fetch(`${API_URL}/brands/${id}/toggle-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // No Authorization header needed
    },
  });

  const data = await handleResponse(response);
  return data.data;
},

  // Toggle popular status
async togglePopularStatus(id: string): Promise<Brand> {
  const response = await fetch(`${API_URL}/brands/${id}/toggle-popular`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // No Authorization header needed
    },
  });

  const data = await handleResponse(response);
  return data.data;
},

  // Bulk update brands
  async bulkUpdateBrands(
    token: string,
    brandIds: string[],
    updates: UpdateBrandDto,
  ): Promise<any> {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    if (!brandIds || brandIds.length === 0) {
      throw new Error("At least one brand ID is required");
    }

    const response = await fetch(`${API_URL}/brands/bulk`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ brandIds, updates }),
    });

    const data = await handleResponse(response);
    return data.data;
  },

  // Update product counts for all brands
  async updateProductCounts(token: string): Promise<void> {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await fetch(`${API_URL}/brands/update-counts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await handleResponse(response);
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