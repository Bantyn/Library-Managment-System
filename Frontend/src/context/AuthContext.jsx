import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('student_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('student_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          if (data.user.role === 'student') {
            setUser(data.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error('Student session restore failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    if (!data.success) {
      throw new Error(data.message || 'Login failed.');
    }

    // Role check: prevent admin from operating student portal
    if (data.user.role !== 'student') {
      throw new Error(
        'This portal is for students only. Please use the Admin Portal for administrator accounts.'
      );
    }

    localStorage.setItem('student_token', data.token);
    localStorage.setItem('student_user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);

    if (!data.success) {
      throw new Error(data.message || 'Registration failed.');
    }

    localStorage.setItem('student_token', data.token);
    localStorage.setItem('student_user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user && user.role === 'student'),
    loading,
    login,
    register,
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
