import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  address?: any;
  social?: any;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    avatar?: string;
    address?: any;
    social?: any;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to check storage
  const navigate = useNavigate();

  // Check for stored token on mount - THIS IS CRITICAL
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check both storages
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log('Auth restored from storage');
        } else {
          console.log('No auth found in storage');
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const { token, ...userData } = data.data;

      // Store based on rememberMe preference
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

      setToken(token);
      setUser(userData);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all storage immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    setToken(null);
    setUser(null);
    
    // Navigate to login - use replace to prevent back button issues
    navigate('/signin', { replace: true });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update in storage
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};