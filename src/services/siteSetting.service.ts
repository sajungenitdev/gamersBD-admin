// services/siteSetting.service.ts
const API_URL = "https://gamersbd-server.onrender.com/api";

export interface SiteSettings {
  _id: string;
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteLogo: string | null;
  siteFavicon: string | null;
  siteBanner: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    linkedin: string;
    discord: string;
    twitch: string;
  };
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  metaAuthor: string;
  footerCopyright: string;
  footerAboutText: string;
  currency: string;
  currencySymbol: string;
  shippingInfo: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  customHeaderScript: string;
  customFooterScript: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

export const siteSettingService = {
  async getSettings(): Promise<SiteSettings> {
    const response = await fetch(`${API_URL}/settings`);
    const data = await handleResponse(response);
    return data.data;
  },

  async updateSettings(settingsData: Partial<SiteSettings>, token: string): Promise<SiteSettings> {
    const response = await fetch(`${API_URL}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settingsData),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  async resetSettings(token: string): Promise<SiteSettings> {
    const response = await fetch(`${API_URL}/settings/reset`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(response);
    return data.data;
  },
};