import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  coins: number;
  referralCode: string;
  referredBy?: string;
  state?: string;
  country?: string;
  currency: string;
  avatar?: string;
  blocked: boolean;
  completedTasks: number;
  totalWithdrawn: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => { success: boolean; isAdmin: boolean; error?: string };
  register: (name: string, email: string, password: string, referralCode?: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
  getAllUsers: () => User[];
  toggleBlockUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = 'amit128kumarku@gmail.com';
const ADMIN_PASSWORD = 'amitji';

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getUsers(): User[] {
  const stored = localStorage.getItem('users');
  return stored ? JSON.parse(stored) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem('users', JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    if (user) localStorage.setItem('currentUser', JSON.stringify(user));
    else localStorage.removeItem('currentUser');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('isAdmin', String(isAdmin));
  }, [isAdmin]);

  const login = (email: string, password: string) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      return { success: true, isAdmin: true };
    }
    const users = getUsers();
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem('passwords') || '{}');
    const found = users.find(u => u.email === email);
    if (!found) return { success: false, isAdmin: false, error: 'User not found' };
    if (found.blocked) return { success: false, isAdmin: false, error: 'Account is blocked' };
    if (passwords[email] !== password) return { success: false, isAdmin: false, error: 'Invalid password' };
    setUser(found);
    setIsAdmin(false);
    return { success: true, isAdmin: false };
  };

  const register = (name: string, email: string, password: string, referralCode?: string) => {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { success: false, error: 'Email already registered' };
    const newUser: User = {
      id: generateId(),
      name,
      email,
      coins: 0,
      referralCode: generateReferralCode(),
      referredBy: referralCode || undefined,
      currency: 'INR',
      blocked: false,
      completedTasks: 0,
      totalWithdrawn: 0,
      createdAt: new Date().toISOString(),
    };
    if (referralCode) {
      const referrer = users.find(u => u.referralCode === referralCode);
      if (referrer) referrer.coins += 10;
    }
    users.push(newUser);
    saveUsers(users);
    const passwords = JSON.parse(localStorage.getItem('passwords') || '{}');
    passwords[email] = password;
    localStorage.setItem('passwords', JSON.stringify(passwords));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = updated;
      saveUsers(users);
    }
  };

  const addCoins = (amount: number) => {
    if (!user) return;
    updateUser({ coins: user.coins + amount, completedTasks: user.completedTasks + 1 });
  };

  const deductCoins = (amount: number) => {
    if (!user) return;
    updateUser({ coins: user.coins - amount, totalWithdrawn: user.totalWithdrawn + amount });
  };

  const getAllUsers = () => getUsers();

  const toggleBlockUser = (userId: string) => {
    const users = getUsers();
    const u = users.find(u => u.id === userId);
    if (u) {
      u.blocked = !u.blocked;
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, register, logout, updateUser, addCoins, deductCoins, getAllUsers, toggleBlockUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
