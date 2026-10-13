import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database.types';
import { DEMO_PROFILES } from '../services/demoData';
import { DataService, isLiveSupabaseConfigured, supabase } from '../services/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  register: (email: string, fullName: string, role: UserRole, address?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wasteroute_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session in local storage
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      } catch {
        // Fallback to default demo generator
        setCurrentUser(DEMO_PROFILES[1]);
      }
    } else {
      // Default to demo generator so the app is instantly usable out of the box
      setCurrentUser(DEMO_PROFILES[1]);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      if (isLiveSupabaseConfigured) {
        // Live Supabase Auth sign-in
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'Password123!', // Standard hackathon/demo credentials or user provided
        });
        if (error) throw error;
        if (authData.user) {
          const profile = await DataService.getProfile(authData.user.id);
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            return;
          }
        }
      }

      // Demo/local fallback: look up by email or matching role
      let user = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (!user && role) {
        user = DEMO_PROFILES.find((p) => p.role === role);
      }
      if (!user) {
        // Create quick session profile for testing
        user = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email,
          full_name: email.split('@')[0],
          role: role || 'generator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, fullName: string, role: UserRole, address?: string) => {
    setIsLoading(true);
    try {
      // Security rule: admin cannot be self-registered
      const safeRole = role === 'admin' ? 'generator' : role;

      if (isLiveSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'Password123!',
          options: {
            data: {
              full_name: fullName,
              role: safeRole,
              address_line: address,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          const profile: Profile = {
            id: data.user.id,
            email,
            full_name: fullName,
            role: safeRole,
            address_line: address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCurrentUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          return;
        }
      }

      const newProfile: Profile = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        full_name: fullName,
        role: safeRole,
        address_line: address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentUser(newProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (isLiveSupabaseConfigured) {
      supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchDemoRole = (role: UserRole) => {
    const demoUser = DEMO_PROFILES.find((p) => p.role === role) || DEMO_PROFILES[0];
    setCurrentUser(demoUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
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
