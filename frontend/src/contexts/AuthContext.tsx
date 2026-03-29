import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

export type UserRole = "admin" | "employee" | "manager" | "finance" | "cfo";

export interface User {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  company?: string;
  currency?: string;
  token?: string; // Appending the JWT physically
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { name: string; email: string; password: string; country: string }) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("erms_user");
    if (stored) {
       try {
         setUser(JSON.parse(stored));
       } catch (err) {
         localStorage.removeItem("erms_user");
       }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string): Promise<User> => {
    try {
      const res = await api.post('/auth/login', { email, password: _password });
      const { token, role } = res.data.data;

      // Ensure lowercase mapping for React Router UI guards natively
      const roleMapped = role.toLowerCase() as UserRole;
      
      const sessionUser: User = {
         id: new Date().getTime().toString(), 
         email: email, 
         role: roleMapped, 
         token 
      };

      setUser(sessionUser);
      localStorage.setItem("erms_user", JSON.stringify(sessionUser));
      return sessionUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Invalid credentials.");
    }
  };

  const signup = async (data: { name: string; email: string; password: string; country: string }): Promise<User> => {
    const payload = {
       name: data.name,
       country: data.country,
       base_currency: 'USD',
       email: data.email,
       password: data.password
    };

    try {
      const res = await api.post('/auth/signup', payload);
      const { token, role } = res.data.data;
      
      const roleMapped = role.toLowerCase() as UserRole;

      const newUser: User = {
        id: new Date().getTime().toString(),
        name: data.name,
        email: data.email,
        role: roleMapped,
        company: "New Company",
        token
      };

      setUser(newUser);
      localStorage.setItem("erms_user", JSON.stringify(newUser));
      return newUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Registration failed.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("erms_user");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
