import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  address: string;
  role: 'admin' | 'auditor' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  login: (address: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on app load
    const storedAddress = localStorage.getItem('walletAddress');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedAddress && storedRole) {
      setUser({ 
        address: storedAddress, 
        role: storedRole as 'admin' | 'auditor' | 'cashier' 
      });
    }
    
    setIsLoading(false);
  }, []);

  const login = async (address: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check user role with backend
      const response = await api.get('/health', {
        headers: { 'x-wallet-address': address }
      });

      if (response.data.status === 'healthy') {
        // Mock role detection for demo - in production this would come from blockchain
        let role: 'admin' | 'auditor' | 'cashier' = 'cashier';
        
        if (address === 'lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu') {
          role = 'admin';
        } else if (address === 'lsk2a8h3k9j4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b') {
          role = 'auditor';
        } else if (address === 'lsk3b9i4k0j5m6n7p8q9r0s1t2u3v4w5x6y7z8a9c') {
          role = 'cashier';
        }

        const userData = { address, role };
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('userRole', role);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};