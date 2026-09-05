import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUser = params.get('user');
      if (urlUser) {
        localStorage.setItem('peoplepay_user', urlUser);
        return JSON.parse(urlUser);
      }
    } catch {}
    const savedUser = localStorage.getItem('peoplepay_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('peoplepay_token', urlToken);
        return urlToken;
      }
    } catch {}
    return localStorage.getItem('peoplepay_token') || null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Payrun Ready for Approval', time: '10 mins ago', read: false },
    { id: 2, title: 'New Attendance Dispute', time: '1 hour ago', read: false },
    { id: 3, title: 'Contract Expiring Soon', time: '2 hours ago', read: true },
  ]);

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };


  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('peoplepay_user', JSON.stringify(userData));
    localStorage.setItem('peoplepay_token', authToken);
    addToast('Successfully signed in to PayOps', 'success');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('peoplepay_user');
    localStorage.removeItem('peoplepay_token');
    addToast('Signed out of PayOps', 'info');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <AppContext.Provider value={{
      user,
      token,
      login,
      logout,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      toggleMobileSidebar,
      searchQuery,
      setSearchQuery,
      notifications,
      setNotifications,
      toasts,
      addToast,
      removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
