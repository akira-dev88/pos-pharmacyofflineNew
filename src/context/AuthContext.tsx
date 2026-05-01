import { createContext, useContext, useEffect, useState } from "react";
import { apiGet } from "../renderer/services/api";

type User = {
  user_uuid?: string;
  name: string;
  role: "owner" | "manager" | "cashier";
  email?: string;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 INIT AUTH (runs once on app load)
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const res = await apiGet("/auth/me");
        const userData = res?.data?.user || res?.user;

        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          // No user data returned — clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // ← keeps old user!
        } catch (error) {
          console.error("Failed to parse stored user data", error);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ✅ LOGIN - Store both token and user
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);

    // Store in localStorage for persistence
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // ✅ LOGOUT - Clear everything
  const logout = () => {
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Navigate to login
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};