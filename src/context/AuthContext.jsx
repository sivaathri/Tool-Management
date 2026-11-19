import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext({
  currentUser: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return authService.getCurrentUser();
  });

  const login = (user, remember = true) => {
    const loggedUser = authService.login(user, remember);
    setCurrentUser(loggedUser);
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
