import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // First, try to restore user from localStorage for immediate UI update
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Then, verify with backend to get latest user data
    if (token) {
      try {
        const response = await authAPI.getMe();
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error verifying auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const userResponse = await authAPI.getMe();
    setUser(userResponse.data);
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    return userResponse.data;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Force re-render when user data changes
  const [userData, setUserData] = useState(null);
  
  // Update userData when user changes
  useEffect(() => {
    if (user) {
      setUserData(user);
      // Also store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      // Try to load from localStorage on initial load
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
  }, [user]);

  const value = {
    user: userData,
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
    },
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!userData,
    isAdmin: userData?.is_admin === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
