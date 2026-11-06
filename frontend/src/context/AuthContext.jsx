import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('paypulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('paypulse_token'));
  const [loading, setLoading] = useState(true);

  // Sync session with server on initial boot
  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem('paypulse_token');
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response?.data) {
        setUser(response.data);
        localStorage.setItem('paypulse_user', JSON.stringify(response.data));
      }
    } catch {
      localStorage.removeItem('paypulse_token');
      localStorage.removeItem('paypulse_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier, password) => {
    const response = await authApi.login(identifier, password);
    const { token: receivedToken, user: receivedUser, account } = response.data;

    const fullUserData = { ...receivedUser, account };
    localStorage.setItem('paypulse_token', receivedToken);
    localStorage.setItem('paypulse_user', JSON.stringify(fullUserData));

    setToken(receivedToken);
    setUser(fullUserData);
    return response;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    const { token: receivedToken, user: receivedUser, account } = response.data;

    const fullUserData = { ...receivedUser, account };
    localStorage.setItem('paypulse_token', receivedToken);
    localStorage.setItem('paypulse_user', JSON.stringify(fullUserData));

    setToken(receivedToken);
    setUser(fullUserData);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('paypulse_token');
    localStorage.removeItem('paypulse_user');
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('paypulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

