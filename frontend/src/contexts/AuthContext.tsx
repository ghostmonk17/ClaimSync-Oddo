import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "employee" | "manager" | "finance" | "cfo";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; country: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  "admin@demo.com": { id: "1", name: "Admin User", email: "admin@demo.com", role: "admin", company: "Acme Corp", currency: "USD" },
  "employee@demo.com": { id: "2", name: "John Employee", email: "employee@demo.com", role: "employee", company: "Acme Corp", currency: "USD" },
  "manager@demo.com": { id: "3", name: "Sarah Manager", email: "manager@demo.com", role: "manager", company: "Acme Corp", currency: "USD" },
  "finance@demo.com": { id: "4", name: "Mike Finance", email: "finance@demo.com", role: "finance", company: "Acme Corp", currency: "USD" },
  "cfo@demo.com": { id: "5", name: "Lisa CFO", email: "cfo@demo.com", role: "cfo", company: "Acme Corp", currency: "USD" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("erms_user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    const found = DEMO_USERS[email.toLowerCase()];
    if (!found) throw new Error("Invalid credentials. Try admin@demo.com, employee@demo.com, manager@demo.com, finance@demo.com, or cfo@demo.com");
    setUser(found);
    localStorage.setItem("erms_user", JSON.stringify(found));
  };

  const signup = async (data: { name: string; email: string; password: string; country: string }) => {
    const currencies: Record<string, string> = { US: "USD", GB: "GBP", IN: "INR", DE: "EUR", JP: "JPY", CA: "CAD", AU: "AUD" };
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: "admin",
      company: "New Company",
      currency: currencies[data.country] || "USD",
    };
    setUser(newUser);
    localStorage.setItem("erms_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("erms_user");
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
