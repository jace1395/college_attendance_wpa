import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading to check local storage

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const loginAsync = (email) => {
      return new Promise((resolve) => {
          setIsLoading(true);
          let role = 'student';
          let name = 'Student User';
          
          const emailPrefix = email.split('@')[0];
          
          if (emailPrefix.includes('principal')) {
            role = 'principal';
            name = 'Principal User';
          } else if (emailPrefix.includes('admin')) {
            role = 'admin';
            name = 'Admin User';
          } else if (/^\d+\./.test(emailPrefix)) {
            role = 'student';
            name = emailPrefix.split('.')[1] || 'Student User';
          } else {
            role = 'teacher';
            name = emailPrefix.replace('.', ' ') || 'Teacher User';
          }

          setTimeout(() => {
            const mockUser = { id: 'mock-id', role, name, email };
            const mockToken = 'mock-jwt-token-xyz';
            
            setUser(mockUser);
            setIsAuthenticated(true);
            
            // Persist to localStorage
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('token', mockToken);
            
            setIsLoading(false);
            resolve(role);
          }, 300);
      });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login: loginAsync, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
