
import React, { useState, useEffect } from 'react';
import { User } from './types.ts';
import { STORAGE_KEYS } from './constants.ts';
import Login from './components/Login.tsx';
import UserPanel from './components/UserPanel.tsx';
import AdminPanel from './components/AdminPanel.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth) {
        setUser(JSON.parse(savedAuth));
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Initializing SecureHub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === 'ADMIN' ? (
        <AdminPanel user={user} onLogout={handleLogout} />
      ) : (
        <UserPanel user={user} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
