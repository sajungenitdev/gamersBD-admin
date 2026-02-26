const API_URL = 'http://localhost:5000/api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  address?: {
    country?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    taxId?: string;
  };
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  avatar?: string;
  createdAt?: string;
}

export const userService = {
  async getProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }
    
    return data.data;
  },

  async updateProfile(token: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    return data.data;
  },
};