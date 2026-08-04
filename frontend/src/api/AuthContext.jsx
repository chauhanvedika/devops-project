import { createContext, useContext, useState } from 'react';
import { getUser, setToken, setUser, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    setUserState(userData);
  };

  const logout = () => {
    clearToken();
    sessionStorage.removeItem('eims_user');
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
