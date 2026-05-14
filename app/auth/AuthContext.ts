"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: string;
  name?: string | null;
  mustChangePassword?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "dl_token";

const getLocalToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
};

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshMe = async () => {
    const token = getLocalToken();
    if (!token) {
      setUser(null);
      return;
    }

    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user ?? null);
      if (data.token && typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, data.token);
      }
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refreshMe();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Erro ao fazer login");
    }

    const data = await response.json() as { token: string; user: User };

    if (typeof window !== "undefined") {
      if (remember) {
        window.localStorage.setItem(TOKEN_KEY, data.token);
      } else {
        window.sessionStorage.setItem(TOKEN_KEY, data.token);
      }
    }

    setUser(data.user);
    router.replace(data.user.role === "ADMIN" ? "/admin/usuarios" : "/dashboard");
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    router.replace("/login");
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, login, logout, refreshMe } },
    children
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
