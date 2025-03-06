
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type UserRole = "admin" | "promoter";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create a default context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin" as UserRole,
  },
  {
    id: "2",
    name: "Promoter User",
    email: "promoter@example.com",
    password: "password123",
    role: "promoter" as UserRole,
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error("Invalid credentials");
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
