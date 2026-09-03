import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount (via cookie or token)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          if (data.user.role === 'admin') {
            setUser(data.user);
            const activeToken = localStorage.getItem('token') || 'cookie_session';
            setToken(activeToken);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        // Fallback check
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password, captchaId, captchaAnswer) => {
    const data = await authService.login(email, password, captchaId, captchaAnswer);

    if (!data.success) {
      throw new Error(data.message || 'Login failed.');
    }

    if (data.user.role !== 'admin') {
      throw new Error('Access denied. Administrator privileges required.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user && user.role === 'admin'),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
